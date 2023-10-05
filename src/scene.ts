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
  MeshPhongMaterial,
  FogExp2,
  SRGBColorSpace,
  TextureLoader,
  PCFSoftShadowMap,
  EquirectangularReflectionMapping,
  ReinhardToneMapping,
  ACESFilmicToneMapping,
  CineonToneMapping,
  PerspectiveCamera,
  Vector2,
  PlaneGeometry,
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
import { BloomPass } from "three/addons/postprocessing/BloomPass.js";
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
let acesFilmic: ACESFilmicToneMapping;
let cineonFilmic: CineonToneMapping;
let renderer: WebGLRenderer;
let colorEncoder: SRGBColorSpace;
let fog: FogExp2;
let scene: Scene;
let group: Group;
let obj: GLTFLoader;
let materials: TextureLoader;
let loadingManager: LoadingManager;
let worldHDR: RGBELoader;
let composer: EffectComposer;
let afterImgPass: AfterimagePass;
let unrealBlmPass: UnrealBloomPass;
let bloomPass: BloomPass;
let FilmPass: FilmPass;
let outputPass: OutputPass;
let renderPass: RenderPass;
let intensity: number = 2.16548;
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.toneMapping = reinhard = ReinhardToneMapping;
    // acesFilmic = ACESFilmicToneMapping
    // cineonFilmic = CineonToneMapping
    renderer.toneMappingExposure = 0.699;
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
      .load("shanghai_bund_4k.hdr", () => {
        worldHDR.mapping = mappingHDR =
          EquirectangularReflectionMapping;
      });
    scene.background = worldHDR;
    scene.environment = worldHDR;
    scene.backgroundBlurriness = 0.5213;
    scene.backgroundIntensity = 0.42456;
    console.log(worldHDR);

    // ===== 🌫 FOG =====

    scene.fog = fog = new FogExp2(0x11151c, 0.1);
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight("white", 0.21789);
    pointLight_0 = new PointLight(0x85ccb8, 6, 20);
    pointLight_1 = new PointLight(0x9f85cc, 6, 20);

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

    pointLight_0.position.set(0, 3, 2);
    pointLight_1.position.set(0, 3, 2);
    group.add(ambientLight);
    group.add(pointLight_0, pointLight_1);
  }

  // ===== 📦 OBJECTS =====
  {
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
    const emissiveMap_bodyLow = materials.load(
      "/src/assets/3d_models/textures/body_low/bl_sc.jpg"
    );

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
    const emissiveMap_headLow = materials.load(
      "/src/assets/3d_models/textures/head_low/hl_sc.jpg"
    );

    // const conf = new MeshPhongMaterial()

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
    /*
    // Lacks ...sc file
    const emissiveMap_rockLow = materials.load(
      "/src/assets/3d_models/textures/rock_low/rl_rh.jpg"
    );
    */

    const MESH_BODYLOW = new MeshStandardMaterial({
      map: basecolorMap_bodyLow,
      // metalness: "",
      metalnessMap: metallicMap_bodyLow,
      normalMap: normalMap_bodyLow,
      // roughness: "",
      roughnessMap: roughnessMap_bodyLow,
      emissiveMap: emissiveMap_bodyLow,
      envMap: worldHDR,
      envMapIntensity: intensity
    });
    const MESH_HEADLOW = new MeshStandardMaterial({
      map: basecolorMap_headLow,
      // metalness: "",
      metalnessMap: metallicMap_headLow,
      normalMap: normalMap_headLow,
      // roughness: "",
      roughnessMap: roughnessMap_headLow,
      emissiveMap: emissiveMap_headLow,
      envMap: worldHDR,
      envMapIntensity: intensity
    });
    const MESH_JEWERLOW = new MeshStandardMaterial({
      map: basecolorMap_jewerLow,
      // metalness: "",
      metalnessMap: metallicMap_jewerLow,
      normalMap: normalMap_jewerLow,
      // roughness: "",
      roughnessMap: roughnessMap_jewerLow,
      envMap: worldHDR,
      envMapIntensity: intensity
    });
    const MESH_ROCKLOW = new MeshStandardMaterial({
      map: basecolorMap_rockLow,
      // metalness: "",
      metalnessMap: metallicMap_rockLow,
      normalMap: normalMap_rockLow,
      // roughness: "",
      roughnessMap: roughnessMap_rockLow,
      envMap: "",
      envMapIntensity: intensity
    });
    const MESH_CLOTHLOW = new MeshStandardMaterial({
      map: basecolorMap_clothLow,
      // metalness: "",
      metalnessMap: metallicMap_clothLow,
      normalMap: normalMap_clothLow,
      // roughness: "",
      roughnessMap: roughnessMap_clothLow,
      envMap: "",
      envMapIntensity: intensity
    });

    // GLTF LOADER

    obj = new GLTFLoader();
    obj.load(
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

        gltf.scene.scale.setScalar(0.48);

        gltf.scene.position.set = (0, -10, 0);

        group.add(gltf.scene);
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
    camera.position.set(2, 2, 5);

    // ===== 🕹️ CONTROLS =====

    cameraControls = new OrbitControls(camera, canvas);
    cameraControls.enableDamping = true;
    cameraControls.target.set = (0, 0, 0);
    console.log(cameraControls);
    cameraControls.autoRotate = false;
    cameraControls.update();

    // MOVES THE OBJECT ON DRAG

    /*
      dragControls = new DragControls(
        [obj],
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
    */

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
      "orange"
    );
    pointLightHelper_2 = new PointLightHelper(
      pointLight_1,
      undefined,
      "orange"
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

  // ==== 😨 DEBUG GUI ====

  {
    afterImgPass = new AfterimagePass();

    afterImgPass.uniforms["damp"].value = 0.85;

    const postParams = {
      exposure: 0.699,
      bloomStrength: 0.899,
      bloomThreshold: 0.499,
      bloomRadius: 1
    };

    // UNREAL BLOOM PASS

    unrealBlmPass = new UnrealBloomPass(
      new Vector2(canvas.clientWidth / canvas.clientHeight),
      1.5,
      0.4,
      0.85
    );

    // POST PARAMS
    unrealBlmPass.threshold = postParams.bloomThreshold;
    unrealBlmPass.exposure = postParams.exposure;
    unrealBlmPass.strength = postParams.bloomStrength;
    unrealBlmPass.radius = postParams.bloomRadius;

    // COMPOSER
    composer = new EffectComposer(renderer);
    composer.addPass((renderPass = new RenderPass(scene, camera)));
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

  // renderer.render(scene, camera);

  composer.render();
}
