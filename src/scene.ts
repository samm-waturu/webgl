import GUI from "lil-gui";
import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  Clock,
  GridHelper,
  LoadingManager,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  TextureLoader,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Group,
  Scene,
  WebGLRenderer
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import * as animations from "./helpers/animations";
import { toggleFullScreen } from "./helpers/fullscreen";
import { resizeRendererToDisplaySize } from "./helpers/responsiveness";
import "./style.css";

const CANVAS_ID = "scene";

let canvas: HTMLElement;
let renderer: WebGLRenderer;
let group: Group;
let materials: TextureLoader;
let gltfLoader: GLTFLoader;
let scene: Scene;
let loadingManager: LoadingManager;
let ambientLight: AmbientLight;
let pointLight: PointLight;
let cube: Mesh;
let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let dragControls: DragControls;
let axesHelper: AxesHelper;
let pointLightHelper: PointLightHelper;
let clock: Clock;
let stats: Stats;
let gui: GUI;

const animation = { enabled: false, play: true };

init();
animate();

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(`canvas#${CANVAS_ID}`)!;
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    scene = new Scene();
    // MODIFICATION: ADDING A GROUP
    group = new Group();

    scene.add(group);
  }

  // ===== 👨🏻‍💼 LOADING MANAGER =====
  {
    loadingManager = new LoadingManager();

    loadingManager.onStart = () => {
      console.log("loading started");
    };
    loadingManager.onProgress = (url, loaded, total) => {
      console.log("loading in progress:");
      console.log(`${url} -> ${loaded} / ${total}`);
    };
    loadingManager.onLoad = () => {
      console.log("loaded!");
    };
    loadingManager.onError = () => {
      console.log("❌ error while loading");
    };
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight("white", 0.4);
    pointLight = new PointLight("#ffdca8", 1.2, 100);
    pointLight.position.set(-2, 3, 3);
    pointLight.castShadow = true;
    pointLight.shadow.radius = 4;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 4000;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    group.add(ambientLight);
    group.add(pointLight);
  }

  // ===== 📦 OBJECTS =====
  {
    const sideLength = 1;
    const cubeGeometry = new BoxGeometry(
      sideLength,
      sideLength,
      sideLength
    );
    const cubeMaterial = new MeshStandardMaterial({
      color: "#f69f1f",
      metalness: 0.5,
      roughness: 0.7
    });
    cube = new Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;
    cube.position.y = 0.5;

    const planeGeometry = new PlaneGeometry(3, 3);
    const planeMaterial = new MeshLambertMaterial({
      color: "gray",
      emissive: "teal",
      emissiveIntensity: 0.2,
      side: 2,
      transparent: true,
      opacity: 0.4
    });
    const plane = new Mesh(planeGeometry, planeMaterial);
    plane.rotateX(Math.PI / 2);
    plane.receiveShadow = true;

    // scene.add(cube);
    // scene.add(plane);
  }

  // ===== 📦 GLTF OBJECTS & MATERIALS =====

  // MATERIALS & TEXTURES

  {
    materials = new TextureLoader();

    const basecolorMap = materials.load("/path to material");
    const metallicMap = materials.load("/path to material");
    const normalMap = materials.load("/path to material");
    const roughnessMap = materials.load("/path to material");
    // no aoMap ...maybe add some ambient lighting as a work around
    const objMaterial = new MeshStandardMaterial({
      map: "",
      // metalness: "",
      metalnessMap: "",
      normalMap: "",
      // roughness: "",
      roughnessMap: "",
      envMap: "",
      envMapIntensity: ""
    });
  }
  // GLTF LOADER
  {
    gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/src/assets/3d_models/buddha.gltf",
      (gltf: object | undefined) => {
        gltf.scene.children[0].material = "some material";
        group.add(gltf.scene);
        console.log(gltf);
      }
    );
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(2, 2, 5);
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new OrbitControls(camera, canvas);
    cameraControls.target = cube.position.clone();
    cameraControls.enableDamping = true;
    cameraControls.autoRotate = false;
    cameraControls.update();

    dragControls = new DragControls(
      [gltfLoader],
      camera,
      renderer.domElement
    );
    dragControls.addEventListener("hoveron", event => {
      event.object.material.emissive.set("orange");
    });
    dragControls.addEventListener("hoveroff", event => {
      event.object.material.emissive.set("black");
    });
    dragControls.addEventListener("dragstart", event => {
      cameraControls.enabled = false;
      animation.play = false;
      event.object.material.emissive.set("black");
      event.object.material.opacity = 0.7;
      event.object.material.needsUpdate = true;
    });
    dragControls.addEventListener("dragend", event => {
      cameraControls.enabled = true;
      animation.play = true;
      event.object.material.emissive.set("black");
      event.object.material.opacity = 1;
      event.object.material.needsUpdate = true;
    });
    dragControls.enabled = false;

    // Full screen
    window.addEventListener("dblclick", event => {
      if (event.target === canvas) {
        toggleFullScreen(canvas);
      }
    });
  }

  // ===== 🪄 HELPERS =====
  {
    axesHelper = new AxesHelper(4);
    axesHelper.visible = false;
    group.add(axesHelper);

    pointLightHelper = new PointLightHelper(
      pointLight,
      undefined,
      "orange"
    );
    pointLightHelper.visible = false;
    group.add(pointLightHelper);

    const gridHelper = new GridHelper(20, 20, "teal", "darkgray");
    gridHelper.position.y = -0.01;
    group.add(gridHelper);
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new Clock();
    stats = new Stats();
    document.body.appendChild(stats.dom);
  }

  // ==== 🐞 DEBUG GUI ====
  {
    gui = new GUI({ title: "🐞 Debug GUI", width: 300 });

    const cubeOneFolder = gui.addFolder("Cube one");

    cubeOneFolder
      .add(cube.position, "x")
      .min(-5)
      .max(5)
      .step(0.5)
      .name("pos x");
    cubeOneFolder
      .add(cube.position, "y")
      .min(-5)
      .max(5)
      .step(0.5)
      .name("pos y");
    cubeOneFolder
      .add(cube.position, "z")
      .min(-5)
      .max(5)
      .step(0.5)
      .name("pos z");

    cubeOneFolder.add(cube.material, "wireframe");
    cubeOneFolder.addColor(cube.material, "color");
    cubeOneFolder.add(cube.material, "metalness", 0, 1, 0.1);
    cubeOneFolder.add(cube.material, "roughness", 0, 1, 0.1);

    cubeOneFolder
      .add(cube.rotation, "x", -Math.PI * 2, Math.PI * 2, Math.PI / 4)
      .name("rotate x");
    cubeOneFolder
      .add(cube.rotation, "y", -Math.PI * 2, Math.PI * 2, Math.PI / 4)
      .name("rotate y");
    cubeOneFolder
      .add(cube.rotation, "z", -Math.PI * 2, Math.PI * 2, Math.PI / 4)
      .name("rotate z");

    cubeOneFolder.add(animation, "enabled").name("animated");

    const controlsFolder = gui.addFolder("Controls");
    controlsFolder.add(dragControls, "enabled").name("drag controls");

    const lightsFolder = gui.addFolder("Lights");
    lightsFolder.add(pointLight, "visible").name("point light");
    lightsFolder.add(ambientLight, "visible").name("ambient light");

    const helpersFolder = gui.addFolder("Helpers");
    helpersFolder.add(axesHelper, "visible").name("axes");
    helpersFolder.add(pointLightHelper, "visible").name("pointLight");

    const cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(cameraControls, "autoRotate");

    // persist GUI state in local storage on changes
    gui.onFinishChange(() => {
      const guiState = gui.save();
      localStorage.setItem("guiState", JSON.stringify(guiState));
    });

    // load GUI state if available in local storage
    const guiState = localStorage.getItem("guiState");
    if (guiState) gui.load(JSON.parse(guiState));

    // reset GUI state button
    const resetGui = () => {
      localStorage.removeItem("guiState");
      gui.reset();
    };
    gui.add({ resetGui }, "resetGui").name("RESET");

    gui.close();
  }
}

function animate() {
  requestAnimationFrame(animate);

  stats.update();

  if (animation.enabled && animation.play) {
    animations.rotate(cube, clock, Math.PI / 3);
    animations.bounce(cube, clock, 1, 0.5, 0.5);
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  cameraControls.update();

  renderer.render(scene, camera);
}
