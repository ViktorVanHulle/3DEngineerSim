import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * Debug
 */
const gui = new dat.GUI();

//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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

//Scene
const scene = new THREE.Scene();

//Objects
// platform
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  wireframe: true,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(groundMesh);

//bowlingbal
const bowlingBallGeometry = new THREE.SphereGeometry(2);
const bowlingBallMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});
const bowlingballMesh = new THREE.Mesh(
  bowlingBallGeometry,
  bowlingBallMaterial
);
scene.add(bowlingballMesh);

//citroen
const lemonGeometry = new THREE.SphereGeometry(1);
const lemonMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  wireframe: true,
});
const lemonMesh = new THREE.Mesh(lemonGeometry, lemonMaterial);
scene.add(lemonMesh);

// Fysieke wereld
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});

// platform
const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  mass: 0,
  type: CANNON.Body.STATIC,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

//bowlingbal
const bowlingBallBody = new CANNON.Body({
  shape: new CANNON.Sphere(2),
  mass: 7.26, //een standaard bowling bal weegt 7.26kg
  position: new CANNON.Vec3(1, 20, 0),
});
world.addBody(bowlingBallBody);

const lemonBody = new CANNON.Body({
  shape: new CANNON.Sphere(1),
  mass: 0.58, //een standaard citroen weegt 58gr
  position: new CANNON.Vec3(0, 15, 0),
});
world.addBody(lemonBody);

const timeStep = 1 / 60;
const clock = new THREE.Clock();
let oldElapsedTime = 0;

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

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
});
