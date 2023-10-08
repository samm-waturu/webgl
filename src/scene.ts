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
  FogExp2,
  SRGBColorSpace,
  TextureLoader,
  PCFSoftShadowMap,
  EquirectangularReflectionMapping,
  ReinhardToneMapping,
  PerspectiveCamera,
  Vector2,
  PlaneGeometry,
  CircleGeometry,
  PointLight,
  PointLightHelper,
  Group,
  Scene,
  WebGLRenderer
} from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import Stats from "three/examples/jsm/libs/stats.module";
import * as animations from "./helpers/animations";
import { toggleFullScreen } from "./helpers/fullscreen";
import { resizeRendererToDisplaySize } from "./helpers/responsiveness";
import "./style.css";

const CANVAS_ID = "scene";

let canvas: HTMLElement;
let reinhard: ReinhardToneMapping;
let renderer: WebGLRenderer;
let colorEncoder: SRGBColorSpace;
let fog: FogExp2;
let scene: Scene;
let group: Group;
let obj: GLTFLoader;
let circle: mesh;
let materials: TextureLoader;
let loadingManager: LoadingManager;
let worldHDR: RGBELoader;
let composer: EffectComposer;
let afterImgPass: AfterimagePass;
let unrealBlmPass: UnrealBloomPass;
let outputPass: OutputPass;
let renderPass: RenderPass;
let vector: Vector2;
let intensity: number = 6;
let mappingHDR: EquirectangularReflectionMapping;
let ambientLight: AmbientLight;
let pointLight_0: PointLight;
let pointLight_1: pointLight;
let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let dragControls: DragControls;
let axesHelper: AxesHelper;
let pointLightHelper: PointLightHelper;
let pointLightHelper_2: PointLightHelper;
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
      alpha: true,
      gammaFactor: 1.2,
      gammaOutput: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.toneMapping = reinhard = ReinhardToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = colorEncoder = SRGBColorSpace;

    console.log(renderer);

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

  // ===== 🌎 HDRI =====

  {
    worldHDR = new RGBELoader()
      .setPath("/src/assets/dir_HDR/")
      .load("gradient_03.hdr", () => {
        worldHDR.mapping = mappingHDR =
          EquirectangularReflectionMapping;
      });

    scene.background = worldHDR;
    scene.environment = worldHDR;
    scene.backgroundBlurriness = 0.8213;
    scene.backgroundIntensity = 0.52456;
    console.log(worldHDR);

    // ===== 🌫 FOG =====

    scene.fog = fog = new FogExp2(0x11151c, 0.1);
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight("white", 0.51789);
    pointLight_0 = new PointLight("white", 4, 100);
    pointLight_1 = new PointLight("white", 4, 100);

    pointLight_0.castShadow = true;
    pointLight_0.shadow.radius = 4;
    pointLight_0.shadow.camera.near = 0.5;
    pointLight_0.shadow.camera.far = 4000;
    pointLight_0.shadow.mapSize.width = 2048;
    pointLight_0.shadow.mapSize.height = 2048;
    pointLight_1.castShadow = true;
    pointLight_1.shadow.radius = 4;
    pointLight_1.shadow.camera.near = 0.5;
    pointLight_1.shadow.camera.far = 4000;
    pointLight_1.shadow.mapSize.width = 2048;
    pointLight_1.shadow.mapSize.height = 2048;

    pointLight_0.position.set(0, 2, 1.5);
    pointLight_1.position.set(0, 1.3, -1.5);
    group.add(pointLight_0, pointLight_1, ambientLight);
  }

  // ===== 📦 OBJECTS =====
  {
    const sideLength = 1;
    /*
      const cubeGeometry = new BoxGeometry(sideLength, sideLength, sideLength)
      const cubeMaterial = new MeshStandardMaterial({
        color: '#f69f1f',
        metalness: 0.5,
        roughness: 0.7,
      })
      cube = new Mesh(cubeGeometry, cubeMaterial)
      cube.castShadow = true
      cube.position.y = 0.5

      const CircleGeometry_1 = new CircleGeometry(0.68, 32);
      const circleMaterial_1 = new MeshStandardMaterial({
        color: "#FBDD00",
        metalness: 0.1,
        envMap: worldHDR,
        envMapIntensity: intensity,
        side: 2,
        roughness: 0.4
      });
      const CircleGeometry_2 = new CircleGeometry(5, 32);
      const circleMaterial_2 = new MeshStandardMaterial({
        color: "#B32800",
        metalness: 0.1,
        roughness: 0.4
      });
      const CircleGeometry_3 = new CircleGeometry(5, 32);
      const circleMaterial_3 = new MeshStandardMaterial({
        color: "#7f0000",
        metalness: 0.1,
        roughness: 0.4
      });

      circle = new Mesh(CircleGeometry_1, circleMaterial_1);

    */

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
    materials.encoding = colorEncoder = SRGBColorSpace;

    // BODYLOW
    const basecolorMap_scene = materials.load(
      "/src/assets/3d_models/textures/default_baseColor.png"
    );

    const SCENE = new MeshStandardMaterial({
      map: basecolorMap_scene,
      metalness: 0.2,
      roughness: 0.5,
      envMap: worldHDR,
      envMapIntensity: intensity
    });

    // GLTF LOADER

    obj = new GLTFLoader();

    obj.load(
      "/src/assets/3d_models/scene.gltf",
      (gltf: object | undefined) => {
        // CLOTHLOW
        gltf.scene.children[0].material = SCENE;

        gltf.scene.scale.setScalar(1);

        gltf.scene.position.y = 1;
        gltf.scene.position.z = 0.5;

        group.add(gltf.scene);

        console.log(gltf);
      }
    );

    console.log(obj, materials);

    // ===== 🎥 CAMERA =====

    camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(3, 2.2, 3);

    // ===== 🕹️ CONTROLS =====

    cameraControls = new OrbitControls(camera, canvas);
    cameraControls.enableDamping = true;
    cameraControls.target.set = (0, 0, 0);
    cameraControls.autoRotate = false;
    cameraControls.update();

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
      pointLight_0,
      undefined,
      "white"
    );
    pointLightHelper_2 = new PointLightHelper(
      pointLight_1,
      undefined,
      "white"
    );
    group.add(pointLightHelper, pointLightHelper_2);
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

    const lightsFolder = gui.addFolder("Lights");
    lightsFolder.add(pointLight_0, "visible").name("point light_0");
    lightsFolder.add(pointLight_1, "visible").name("point light_1");
    lightsFolder.add(ambientLight, "visible").name("ambient light");

    const helpersFolder = gui.addFolder("Helpers");
    helpersFolder.add(axesHelper, "visible").name("axes");
    helpersFolder
      .add(pointLightHelper, "visible")
      .name("pointLight_0");
    helpersFolder
      .add(pointLightHelper_2, "visible")
      .name("pointLight_1");

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

  // ==== Boom ====

  {
    afterImgPass = new AfterimagePass();

    afterImgPass.uniforms["damp"].value = 0.75;

    const postParams = {
      bloomStrength: 1,
      bloomThreshold: 0.4,
      bloomRadius: 1
    };

    // UNREAL BLOOM PASS

    renderPass = new RenderPass(scene, camera);

    vector = new Vector2((canvas.clientWidth, canvas.clientHeight));

    unrealBlmPass = new UnrealBloomPass(vector, 1.5, 0.4, 0.85);
    // POST PARAMS
    unrealBlmPass.threshold = postParams.bloomThreshold;
    unrealBlmPass.strength = postParams.bloomStrength;
    unrealBlmPass.radius = postParams.bloomRadius;

    // COMPOSER
    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(afterImgPass);
    composer.addPass(unrealBlmPass);
    composer.addPass((outputPass = new OutputPass()));
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

  // renderer.render(scene, camera)

  composer.render();
}
