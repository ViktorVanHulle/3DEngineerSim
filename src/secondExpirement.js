import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { XRButton } from "three/examples/jsm/webxr/XRButton";

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
directionalLight.position.set(2, 15, 5);
scene.add(directionalLight);

/**
 * Debug
 */
const gui = new dat.GUI();
const debugObject = {};
debugObject.kracht = 0;
debugObject.maakBowlingbal = () => {
  createBowlingball(
    2,
    {
      x: 8,
      y: 13,
      z: (Math.random() - 0.5) * 10,
    },
    debugObject.kracht
  );
};
debugObject.maakCitroen = () => {
  createLemon(
    1,
    {
      x: 8,
      y: 13,
      z: (Math.random() - 0.5) * 10,
    },
    debugObject.kracht
  );
};
gui.add(debugObject, "maakBowlingbal");
gui.add(debugObject, "maakCitroen");
gui.add(debugObject, "kracht", 0, 10000, 1);
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
const groundGeometry = new THREE.BoxGeometry(30, 30, 2);
const wallGeometry = new THREE.BoxGeometry(10, 30, 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: "#777777",
  metalness: 0.3,
  roughness: 0.4,
  side: THREE.DoubleSide,
  // wireframe: true,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
const wallMesh = new THREE.Mesh(wallGeometry, groundMaterial);
groundMesh.receiveShadow = true;
scene.add(groundMesh);
scene.add(wallMesh);

//
// Fysieke wereld
//
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});
// Materiaal
const concreteMaterial = new CANNON.Material("concrete");
const plasticMaterial = new CANNON.Material("plastic");
const lightweightMaterial = new CANNON.Material("lightweight");

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
const conreteLightweightContactMaterial = new CANNON.ContactMaterial(
  concreteMaterial,
  lightweightMaterial,
  {
    friction: 0.5,
    restitution: 0.0,
  }
);
world.addContactMaterial(conretePlasticContactMaterial);
world.addContactMaterial(conreteConcreteContactMaterial);
world.addContactMaterial(conreteLightweightContactMaterial);

conretePlasticContactMaterial.contactEquationStiffness = 1e8;
conretePlasticContactMaterial.contactEquationRegularizationTime = 3;
conreteConcreteContactMaterial.contactEquationStiffness = 1e8;
conreteConcreteContactMaterial.contactEquationRegularizationTime = 3;
conreteLightweightContactMaterial.contactEquationStiffness = 1e8;
conreteLightweightContactMaterial.contactEquationRegularizationTime = 3;

// platform body
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(15, 15, 1)),
  mass: 0,
  type: CANNON.Body.STATIC,
  material: concreteMaterial,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, -Math.PI * 0.25, 0);

const wallBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(7.5, 15, 1)),
  mass: 0,
  type: CANNON.Body.STATIC,
  material: lightweightMaterial,
});
world.addBody(wallBody);
wallBody.position.set(-12, -5, 0);
wallBody.quaternion.setFromEuler(-Math.PI / 2, -Math.PI / 2, 0);

const ids = [];
wallBody.addEventListener("collide", function (e) {
  console.log(e.contact.bi);
  if (!ids.includes(e.contact.bi.id)) {
    var relativeVelocity = e.contact.getImpactVelocityAlongNormal();
    const contactP = document.createElement("p");
    contactP.style.color = "red";
    contactP.textContent =
      "relatieve snelheid (m/s): " + Math.abs(relativeVelocity).toFixed(2);
    const contactDiv = document.createElement("div");
    contactDiv.appendChild(contactP);
    const contactLabel = new CSS2DObject(contactDiv);
    scene.add(contactLabel);
    contactLabel.position.set(-12, -5, e.contact.rj.z);

    ids.push(e.contact.bi.id);
  }
  // if(Math.abs(relativeVelocity) > 10){
  //     // More energy
  // } else {
  //     // Less energy
  // }
});

// Utils
let objectsToUpdate = [];

function createBowlingball(radius, position, power) {
  // label
  // bowlingbal label
  const bowlingBallP = document.createElement("p");
  const bowlingBallDiv = document.createElement("div");
  bowlingBallDiv.appendChild(bowlingBallP);
  const bowlingBalLabel = new CSS2DObject(bowlingBallDiv);
  scene.add(bowlingBalLabel);
  bowlingBalLabel.position.set(0, 0, 0);

  gltfLoader.load("/bowling_ball/scene.gltf", (gltf) => {
    gltf.scene.children[0].scale.multiplyScalar(5);
    gltf.scene.scale.set(radius, radius, radius);
    gltf.scene.add(bowlingBalLabel);
    gltf.scene.position.copy(position);
    gltf.scene.castShadow = true;
    scene.add(gltf.scene);

    // Cannon.js body
    const bowlingBallBody = new CANNON.Body({
      shape: new CANNON.Sphere(radius),
      mass: 7.26, //een standaard bowlingbal weegt 7.26kg
      position: new CANNON.Vec3(1, 20, 0),
      material: concreteMaterial,
    });

    bowlingBallBody.position.copy(position);
    const force = new CANNON.Vec3(0, -power, 0);
    bowlingBallBody.applyForce(force);
    world.addBody(bowlingBallBody);

    //Opslaan in object voor later te animeren
    objectsToUpdate.push({
      mesh: gltf.scene,
      body: bowlingBallBody,
      text: bowlingBallP,
    });
  });
}

function createLemon(radius, position, power) {
  //citroen label
  const lemonP = document.createElement("p");
  const lemonDiv = document.createElement("div");
  lemonDiv.appendChild(lemonP);
  const lemonLabel = new CSS2DObject(lemonDiv);
  scene.add(lemonLabel);
  lemonLabel.position.set(0, 0, 0);

  gltfLoader.load("/lemon/scene.gltf", (gltf) => {
    gltf.scene.children[0].scale.multiplyScalar(8);
    gltf.scene.scale.set(radius, radius, radius);
    gltf.scene.add(lemonLabel);
    gltf.scene.position.copy(position);
    gltf.scene.castShadow = true;
    scene.add(gltf.scene);

    // citroen body
    const lemonBody = new CANNON.Body({
      shape: new CANNON.Sphere(radius),
      mass: 0.58, //een standaard citroen weegt 58gr
      position: new CANNON.Vec3(0, 0, 0),
      material: plasticMaterial,
    });
    lemonBody.position.copy(position);

    const force = new CANNON.Vec3(0, -power, 0);
    lemonBody.applyForce(force);
    world.addBody(lemonBody);

    //Opslaan in object voor later te animeren
    objectsToUpdate.push({
      mesh: gltf.scene,
      body: lemonBody,
      text: lemonP,
    });
  });
}

createBowlingball(2, { x: 8, y: 13, z: 0 }, 0);
createLemon(1, { x: 8, y: 13, z: 3 }, 0);

/**
 * VRT
 */
// AR
renderer.xr.enabled = true;
const ARbutton = ARButton.createButton(renderer);
document.body.appendChild(ARbutton);
// VR
const VRbutton = VRButton.createButton(renderer);
document.body.appendChild(VRbutton);
// XR
const XRbutton = XRButton.createButton(renderer);
document.body.appendChild(XRbutton);

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
  wallMesh.position.copy(wallBody.position);
  wallMesh.quaternion.copy(wallBody.quaternion);

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
