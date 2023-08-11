import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";

//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//Scene
const scene = new THREE.Scene();
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
const groundMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  wireframe: true,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
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

const bowlingBallGeometry = new THREE.SphereGeometry(1);
const bowlingBallMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});

function createBowlingball(radius, position) {
  // label
  // bowlingbal label
  const bowlingBallP = document.createElement("p");
  const bowlingBallDiv = document.createElement("div");
  bowlingBallDiv.appendChild(bowlingBallP);
  const bowlingBalLabel = new CSS2DObject(bowlingBallDiv);
  scene.add(bowlingBalLabel);
  bowlingBalLabel.position.set(0, 0, -2);
  // Three.js mesh
  //bowlingbal object
  const bowlingballMesh = new THREE.Mesh(
    bowlingBallGeometry,
    bowlingBallMaterial
  );
  bowlingballMesh.scale.set(radius, radius, radius);
  bowlingballMesh.add(bowlingBalLabel);
  bowlingballMesh.position.copy(position);
  scene.add(bowlingballMesh);

  // Cannon.js body
  const bowlingBallBody = new CANNON.Body({
    shape: new CANNON.Sphere(radius),
    mass: 7.26, //een standaard bowlingbal weegt 7.26kg
    position: new CANNON.Vec3(1, 20, 0),
    material: concreteMaterial,
  });

  bowlingBallBody.position.copy(position);
  world.addBody(bowlingBallBody);

  //Opslaan in object voor later te animeren
  objectsToUpdate.push({
    mesh: bowlingballMesh,
    body: bowlingBallBody,
    text: bowlingBallP,
  });
}

const lemonGeometry = new THREE.SphereGeometry(1);
const lemonMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  wireframe: true,
});

function createLemon(radius, position) {
  //citroen label
  const lemonP = document.createElement("p");
  const lemonDiv = document.createElement("div");
  lemonDiv.appendChild(lemonP);
  const lemonLabel = new CSS2DObject(lemonDiv);
  scene.add(lemonLabel);
  lemonLabel.position.set(0, 0, -2);

  //citroen object
  const lemonMesh = new THREE.Mesh(lemonGeometry, lemonMaterial);
  lemonMesh.add(lemonLabel);
  lemonMesh.scale.set(radius, radius, radius);
  lemonMesh.position.copy(position);
  scene.add(lemonMesh);

  // citroen body
  const lemonBody = new CANNON.Body({
    shape: new CANNON.Sphere(1),
    mass: 0.58, //een standaard citroen weegt 58gr
    position: new CANNON.Vec3(0, 15, 0),
    material: plasticMaterial,
  });
  lemonBody.position.copy(position);
  world.addBody(lemonBody);

  //Opslaan in object voor later te animeren
  objectsToUpdate.push({
    mesh: lemonMesh,
    body: lemonBody,
    text: lemonP,
  });
}

createBowlingball(2, { x: 2, y: 200, z: 0 });
createLemon(1, { x: 5, y: 200, z: 0 });

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
