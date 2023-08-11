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

// bowlingbal label
const bowlingBallP = document.createElement("p");
const bowlingBallDiv = document.createElement("div");
bowlingBallDiv.appendChild(bowlingBallP);
const bowlingBalLabel = new CSS2DObject(bowlingBallDiv);
scene.add(bowlingBalLabel);
bowlingBalLabel.position.set(0, 0, -2);
//citroen label
const lemonP = document.createElement("p");
const lemonDiv = document.createElement("div");
lemonDiv.appendChild(lemonP);
const lemonLabel = new CSS2DObject(lemonDiv);
scene.add(lemonLabel);
lemonLabel.position.set(0, 0, -2);

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

//bowlingbal object
const bowlingBallGeometry = new THREE.SphereGeometry(2);
const bowlingBallMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});
const bowlingballMesh = new THREE.Mesh(
  bowlingBallGeometry,
  bowlingBallMaterial
);
bowlingballMesh.add(bowlingBalLabel);
scene.add(bowlingballMesh);

//citroen object
const lemonGeometry = new THREE.SphereGeometry(1);
const lemonMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  wireframe: true,
});
const lemonMesh = new THREE.Mesh(lemonGeometry, lemonMaterial);
lemonMesh.add(lemonLabel);
scene.add(lemonMesh);

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
    restitution: 0.5,
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

// platform body
const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  mass: 0,
  type: CANNON.Body.STATIC,
  material: concreteMaterial,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

//bowlingbal body
const bowlingBallBody = new CANNON.Body({
  shape: new CANNON.Sphere(2),
  mass: 7.26, //een standaard bowling bal weegt 7.26kg
  position: new CANNON.Vec3(1, 20, 0),
  material: concreteMaterial,
});
// FORCE
bowlingBallBody.applyForce(
  new CANNON.Vec3(0, 0, 0),
  new CANNON.Vec3(0, 0, 0)
);
world.addBody(bowlingBallBody);

// citroen body
const lemonBody = new CANNON.Body({
  shape: new CANNON.Sphere(1),
  mass: 0.58, //een standaard citroen weegt 58gr
  position: new CANNON.Vec3(0, 15, 0),
  material: plasticMaterial,
});
world.addBody(lemonBody);

const timeStep = 1 / 60;
const clock = new THREE.Clock();
let oldElapsedTime = 0;


// Animate
function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;
  world.step(timeStep, deltaTime, 3);

  //platform
  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);
  //bowling bal
  bowlingballMesh.position.copy(bowlingBallBody.position);
  bowlingballMesh.quaternion.copy(bowlingBallBody.quaternion);
  //lemon
  lemonMesh.position.copy(lemonBody.position);
  lemonMesh.quaternion.copy(lemonBody.quaternion);

  // labelRenderer
  labelRenderer.render(scene, camera);
  bowlingBallP.textContent =
    "val snelheid (m/s):" + Math.abs(bowlingBallBody.velocity.y.toFixed(2));
  lemonP.textContent =
    "val snelheid (m/s):" + Math.abs(lemonBody.velocity.y.toFixed(2));

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
