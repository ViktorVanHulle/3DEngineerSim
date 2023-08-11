import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

/**
 * Models
 */

const gltfLoader = new GLTFLoader();

//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//Scene
const scene = new THREE.Scene();

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Debug
 */
const gui = new dat.GUI();
const debugObject = {};
debugObject.maakBowlingbal = () => {
  createBowlingball(2, {
    x: (Math.random() - 0.5) * 10,
    y: 10,
    z: (Math.random() - 0.5) * 10,
  });
};
debugObject.maakCitroen = () => {
  createLemon(1, {
    x: (Math.random() - 0.5) * 10,
    y: 10,
    z: (Math.random() - 0.5) * 10,
  });
};
gui.add(debugObject, "maakBowlingbal");
gui.add(debugObject, "maakCitroen");
/**
 * CSS2DRenderer
 */
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(sizes.width, sizes.height);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.color = "white";
labelRenderer.domElement.style.top = "0px";
labelRenderer.domElement.style.pointerEvents = "none"; //Anders werken de OrbitControls niet
document.body.appendChild(labelRenderer.domElement);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("canvas.webgl"),
});
renderer.setSize(sizes.width, sizes.height);

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 20, -30);
orbit.update();

//Objects
// platform object
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: "#777777",
  metalness: 0.3,
  roughness: 0.4,
  side: THREE.DoubleSide,
  // wireframe: true,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

//
// Fysieke wereld
//
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});
// Materiaal
const concreteMaterial = new CANNON.Material("concrete");
const plasticMaterial = new CANNON.Material("plastic");

const conretePlasticContactMaterial = new CANNON.ContactMaterial(
  concreteMaterial,
  plasticMaterial,
  {
    friction: 0.3,
    restitution: 0.2,
  }
);

const conreteConcreteContactMaterial = new CANNON.ContactMaterial(
  concreteMaterial,
  concreteMaterial,
  {
    friction: 0.1,
    restitution: 0.1,
  }
);
world.addContactMaterial(conretePlasticContactMaterial);
world.addContactMaterial(conreteConcreteContactMaterial);

conretePlasticContactMaterial.contactEquationStiffness = 1e8;
conretePlasticContactMaterial.contactEquationRegularizationTime = 3;
conreteConcreteContactMaterial.contactEquationStiffness = 1e8;
conreteConcreteContactMaterial.contactEquationRegularizationTime = 3;

// platform body
const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  mass: 0,
  type: CANNON.Body.STATIC,
  material: concreteMaterial,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

// Utils
let objectsToUpdate = [];

function createBowlingball(radius, position) {
  // label
  // bowlingbal label
  const bowlingBallP = document.createElement("p");
  const bowlingBallDiv = document.createElement("div");
  bowlingBallDiv.appendChild(bowlingBallP);
  const bowlingBalLabel = new CSS2DObject(bowlingBallDiv);
  scene.add(bowlingBalLabel);
  bowlingBalLabel.position.set(0, 0, 0);

  gltfLoader.load("/bowling_ball/scene.gltf", (gltf) => {
    gltf.scene.scale.set(6 * radius, 6 * radius, 6 * radius);
    gltf.scene.add(bowlingBalLabel);
    gltf.scene.position.copy(position);
    gltf.scene.castShadow = true;
    scene.add(gltf.scene);

    // Cannon.js body
    const bowlingBallBody = new CANNON.Body({
      shape: new CANNON.Sphere(1.7),
      mass: 7.26, //een standaard bowlingbal weegt 7.26kg
      position: new CANNON.Vec3(1, 20, 0),
      material: concreteMaterial,
    });

    bowlingBallBody.position.copy(position);
    world.addBody(bowlingBallBody);

    //Opslaan in object voor later te animeren
    objectsToUpdate.push({
      mesh: gltf.scene,
      body: bowlingBallBody,
      text: bowlingBallP,
    });
  });
}

function createLemon(radius, position) {
  //citroen label
  const lemonP = document.createElement("p");
  const lemonDiv = document.createElement("div");
  lemonDiv.appendChild(lemonP);
  const lemonLabel = new CSS2DObject(lemonDiv);
  scene.add(lemonLabel);
  lemonLabel.position.set(0, 0, 0);

  gltfLoader.load("/lemon/scene.gltf", (gltf) => {
    gltf.scene.scale.set(10 * radius, 10 * radius, 10 * radius);
    gltf.scene.add(lemonLabel);
    gltf.scene.position.copy(position);
    gltf.scene.castShadow = true;
    scene.add(gltf.scene);

    // citroen body
    const lemonBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.3),
      mass: 0.58, //een standaard citroen weegt 58gr
      position: new CANNON.Vec3(0, 0, 0),
      material: plasticMaterial,
    });
    lemonBody.position.copy(position);
    world.addBody(lemonBody);

    //Opslaan in object voor later te animeren
    objectsToUpdate.push({
      mesh: gltf.scene,
      body: lemonBody,
      text: lemonP,
    });
  });
}

createBowlingball(2, { x: 2, y: 20, z: 0 });
createLemon(1, { x: 5, y: 20, z: 0 });

const timeStep = 1 / 60;
const clock = new THREE.Clock();
let oldElapsedTime = 0;

// Animate
function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update physics world
  world.step(timeStep, deltaTime, 3);

  for (const object of objectsToUpdate) {
    //bowlingbal & citroen
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
    object.text.textContent =
      "val snelheid (m/s):" + Math.abs(object.body.velocity.y.toFixed(2));
  }

  //platform
  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);

  // labelRenderer
  labelRenderer.render(scene, camera);

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

//Resizing
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update labelRenderer
  labelRenderer.setSize(sizes.width, sizes.height);
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
});
