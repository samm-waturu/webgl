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
    group.add(plane);
  }

  // ===== 📦 GLTF OBJECTS & MATERIALS =====

  // MATERIALS & TEXTURES

  {
    materials = new TextureLoader();

    // BODYLOW
    const basecolorMap_bodyLow = materials.load(
      "/src/assets/3d_models/textures/body_low/bl_bc.jpg"
    );
    const metallicMap_bodyLow = materials.load(
      "/src/assets/3d_models/textures/body_low/bl_ml.jpg"
    );
    const normalMap_bodyLow = materials.load(
      "/src/assets/3d_models/textures/body_low/bl_nm.jpg"
    );
    const roughnessMap_bodyLow = materials.load(
      "/src/assets/3d_models/textures/body_low/bl_rh.jpg"
    );

    // const spec_unknown = materials.load("/path to spec")

    // CLOTHLOW

    const basecolorMap_clothLow = materials.load(
      "/src/assets/3d_models/textures/cloth_low/cl_bc.png"
    );
    const metallicMap_clothLow = materials.load(
      "/src/assets/3d_models/textures/cloth_low/cl_ml.png"
    );
    const normalMap_clothLow = materials.load(
      "/src/assets/3d_models/textures/cloth_low/cl_nm.jpg"
    );
    const roughnessMap_clothLow = materials.load(
      "/src/assets/3d_models/textures/cloth_low/cl_rh.png"
    );

    // HEADLOW
    const basecolorMap_headLow = materials.load(
      "/src/assets/3d_models/textures/head_low/hl_bc.jpg"
    );
    const metallicMap_headLow = materials.load(
      "/src/assets/3d_models/textures/head_low/hl_ml.jpg"
    );
    const normalMap_headLow = materials.load(
      "/src/assets/3d_models/textures/head_low/hl_nm.jpg"
    );
    const roughnessMap_headLow = materials.load(
      "/src/assets/3d_models/textures/head_low/hl_rh.jpg"
    );

    // const spec_unknown = materials.load("/path to spec")

    // JEWERLOW
    const basecolorMap_jewerLow = materials.load(
      "/src/assets/3d_models/textures/jewer_low/jl_bc.jpg"
    );
    const metallicMap_jewerLow = materials.load(
      "/src/assets/3d_models/textures/jewer_low/jl_ml.jpg"
    );
    const normalMap_jewerLow = materials.load(
      "/src/assets/3d_models/textures/jewer_low/jl_nm.jpg"
    );
    const roughnessMap_jewerLow = materials.load(
      "/src/assets/3d_models/textures/jewer_low/jl_rh.jpg"
    );

    // ROCKLOW
    const basecolorMap_rockLow = materials.load(
      "/src/assets/3d_models/textures/rock_low/rl_bc.jpg"
    );
    const metallicMap_rockLow = materials.load(
      "/src/assets/3d_models/textures/rock_low/rl_ml.jpg"
    );
    const normalMap_rockLow = materials.load(
      "/src/assets/3d_models/textures/rock_low/rl_nm.jpg"
    );
    const roughnessMap_rockLow = materials.load(
      "/src/assets/3d_models/textures/rock_low/rl_rh.jpg"
    );

    const MESH_BODYLOW = new MeshStandardMaterial({
      map: basecolorMap_bodyLow,
      // metalness: "",
      metalnessMap: metallicMap_bodyLow,
      normalMap: normalMap_bodyLow,
      // roughness: "",
      roughnessMap: roughnessMap_bodyLow,
      envMap: "",
      envMapIntensity: 0
    });
    const MESH_HEADLOW = new MeshStandardMaterial({
      map: basecolorMap_headLow,
      // metalness: "",
      metalnessMap: metallicMap_headLow,
      normalMap: normalMap_headLow,
      // roughness: "",
      roughnessMap: roughnessMap_headLow,
      envMap: "",
      envMapIntensity: 0
    });
    const MESH_JEWERLOW = new MeshStandardMaterial({
      map: basecolorMap_jewerLow,
      // metalness: "",
      metalnessMap: metallicMap_jewerLow,
      normalMap: normalMap_jewerLow,
      // roughness: "",
      roughnessMap: roughnessMap_jewerLow,
      envMap: "",
      envMapIntensity: 0
    });
    const MESH_ROCKLOW = new MeshStandardMaterial({
      map: basecolorMap_rockLow,
      // metalness: "",
      metalnessMap: metallicMap_rockLow,
      normalMap: normalMap_rockLow,
      // roughness: "",
      roughnessMap: roughnessMap_rockLow,
      envMap: "",
      envMapIntensity: 0
    });
    const MESH_CLOTHLOW = new MeshStandardMaterial({
      map: basecolorMap_clothLow,
      // metalness: "",
      metalnessMap: metallicMap_clothLow,
      normalMap: normalMap_clothLow,
      // roughness: "",
      roughnessMap: roughnessMap_clothLow,
      envMap: "",
      envMapIntensity: 0
    });

    // GLTF LOADER

    gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/src/assets/3d_models/mmk.gltf",
      (gltf: object | undefined) => {
        // CLOTHLOW
        gltf.scene.children[0].material = MESH_CLOTHLOW;
        // BODYLOW
        gltf.scene.children[1].material = MESH_BODYLOW;
        // HEADLOW
        gltf.scene.children[2].material = MESH_HEADLOW;
        // ROCKLOW
        gltf.scene.children[3].material = MESH_ROCKLOW;
        // JEWERLOW
        gltf.scene.children[4].material = MESH_JEWERLOW;

        gltf.scene.position.set = (0, 0, 0);
        gltf.scene.scale.setScalar(0.48);
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
