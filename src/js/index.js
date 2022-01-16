//#region Imports

import "../styles/style.css";

import * as Utils from "./utils.js";

import * as THREE from 'three';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

import hljs from "highlight.js/lib/core";
import "highlight.js/styles/nord.css";
import javascript from "highlight.js/lib/languages/javascript";
hljs.registerLanguage("javascript", javascript);
hljs.highlightAll();

//#endregion

//#region Three.js Initialisation

//#region Base Initialisation

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    10000
);
// Adjust the camera's default position
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color("black"), 1);
renderer.outputEncoding = THREE.sRGBEncoding;

// Add an ID to the canvas element so events can be added to it
renderer.domElement.setAttribute("id", "canvas")

// Add the renderer to the DOM
document.body.appendChild(renderer.domElement);

//#endregion

//#region Other Intialisation

// Allows the user to move the camera around the scene
const controls = new OrbitControls(camera, renderer.domElement);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// const grid = new THREE.InfiniteGridHelper(10, 100, new THREE.Color("white"), 250);
const grid = new THREE.AmbientLight(0xffffff, 1);
scene.add(grid);

// Construct the transform gizmo
const transformGizmo = Utils.ConstructGizmos();
transformGizmo.visible = false;
scene.add(transformGizmo)

//#endregion

//#endregion

//#region Post Processing Initialisation

let composer = new EffectComposer(renderer);

let renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

let outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 10;
/*
    When the grid passes behind an outlined object it interferes with the outline.
    Maybe this is to do with a shader on the grid?
    Disabling the grid fixes it,
    but so does setting both the visible and hidden edge colours to be the same on the outline pass.
*/
outlinePass.visibleEdgeColor.set("#ff0000");
// outlinePass.hiddenEdgeColor.set("#ff0000");

composer.addPass(outlinePass);

//#endregion

//#region Global Variable Initialisation

// Whether the grid should be shown
let showGrid = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// The default material for new objects
const defaultMaterial = new THREE.MeshBasicMaterial({ color: 0x49ef4 });

// The currently selected object
let clickedObject;

// Is the code panel being dragged?
let draggingCodePanel = false;

// Whether to show the boilerplate code in the code view
let showBoilerplate = true;

//Whether to show the required imports in the code view
let showImports = false;

// The available shape primitives
const primitives = [
    {text: "Box"},
    {text: "Circle"},
    {text: "Cone"},
    {text: "Cylinder"},
    {text: "Dodecahedron"},
    {text: "Icosahedron"},
    {text: "Octahedron"},
    {text: "Plane"},
    {text: "Ring"},
    {text: "Sphere"},
    {text: "Tetrahedron"},
    {text: "Torus"},
    {text: "TorusKnot"}
    //{text: "Tube"}
];

// The objects in the scene to be omitted from the output in the code view
const ignoredUUIDs = [grid.uuid, ambientLight.uuid, dirLight.uuid, transformGizmo.uuid];

//#endregion

// Add the primitives to the "Add Shape" dropdown
Utils.ConstructObjectDropdown(primitives);

// Generate the intial code for the base scene in the code view
Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);

function render() {   
    requestAnimationFrame(render);

    composer.render(scene, camera);
}
render();


//#region Editor Events

//#region Object Events

window.onAddShapeClick = () => {
    const dropdown = document.getElementById("primitives-dropdown");
    
    const obj = Utils.CreateShape(dropdown.value, defaultMaterial, Utils.GetGeometry)
    scene.add(obj);

    // Re-generate the output code in the code view
    Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);
}

window.onDeleteObject = () => {
    scene.remove(clickedObject);

    // Hide the object control panel.
    document.getElementById("object-control-panel").style.display = "none";

    // Re-generate the output code in the code view
    Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);
    
    // Hide the transform gizmo
    transformGizmo.visible = false;
}

window.onDuplicateObject = () => { 
    if (!clickedObject) return;
    
    let newObject = clickedObject.clone()
    newObject.position.set(0, 0, 0);
    scene.add(newObject)
    
    // Re-generate the output code in the code view
    Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);
}

window.onTransformInputChange = () => {
    Utils.UpdateTransforms(clickedObject);

    Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);

    transformGizmo.visible = true;
    transformGizmo.position.set(...clickedObject.position);
}

window.onNameInput = (element) => {
    clickedObject.name = element.value;

    Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);
}

//#endregion

//#region Code Panel Events

window.onStartDragBar = () => draggingCodePanel = true;

window.onToggleBoilerplate = (element) => {
    showBoilerplate = !showBoilerplate;
    element.value = showBoilerplate ? "Hide Boilerplate" : "Show Boilerplate";
    
    Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);
}

window.onToggleImports = (element) => {
    showImports = !showImports;
    element.value = showImports ? "Hide Imports" : "Show Imports";
    
    Utils.GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs);
}

//#endregion

//#region Grid Events
window.onGridToggle = (element) => {
    showGrid = !showGrid;
    element.value = showGrid ? "Hide Grid" : "Show Grid";
    showGrid ? scene.add(grid) : scene.remove(grid);
}

window.onGridColorChange = (element) => grid.material.uniforms.uColor.value.set(element.value);

//#endregion

//#endregion

//#region DOM Events

document.getElementById("canvas").onmousedown = (event) => {
    const object = Utils.GetHit(raycaster, mouse, camera, scene);

    if (object === transformGizmo) {
        controls.enabled = false;
    }
}

document.getElementById("canvas").onmouseup = (event) => {
    // Re-enable orbit controls
    controls.enabled = true;
}

window.onmouseup = () => draggingCodePanel = false;

window.onmousemove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (draggingCodePanel) {
        let panel = document.getElementById("code-panel");
        panel.style.width = window.innerWidth - event.clientX - 30 + "px";
    }
}

document.getElementById("canvas").onclick = (event) => {
    // Get the currently clicked object
    clickedObject = Utils.GetHit(raycaster, mouse, camera, scene);

    // Hide/show the object control panel.
    document.getElementById("object-control-panel").style.display = clickedObject ? "flex" : "none";

    if (clickedObject) {
        // Set the object info on the UI
        document.getElementById("object-type").innerHTML = clickedObject.userData.type;
        document.getElementById("object-name").value = clickedObject.name;
        
        // Populate pos, rot, and scale inputs in the UI.
        Utils.PopulateTransforms(clickedObject);

        // Add outline to clicked object
        outlinePass.selectedObjects = [clickedObject];

        if (clickedObject.userData.sceneObject) {
            /*
                If a user-added object is clicked, 
                enable the transform gizmo and 
                move it to the selected object.
            */
            transformGizmo.visible = true;
            transformGizmo.position.set(...clickedObject.position);
        } else {
            /*
                Hide the transform gizmo 
                if a non-user created scene object is clicked, 
                for example the the transform gizmo itself.
            */
            transformGizmo.visible = false;
        }

    } else {
        // Remove shape outlines
        outlinePass.selectedObjects = [];

        // Hide the transform gizmo
        transformGizmo.visible = false;
    }
}

window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height);
}, false);

//#endregion
