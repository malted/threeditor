export function ConstructObjectDropdown(primitives) {
	const parent = document.getElementById("primitives-dropdown");
    primitives.forEach(p => {
        const option = document.createElement("option");
        option.value = p.text;
        option.innerHTML = p.text;
        parent.appendChild(option);
    });
}

// Construct the transform gizmo
export function ConstructGizmos() {
    const transformGizmo = new THREE.Group();

    const stalkLength = 2;
    const stalkMaterial = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false });
    const xMaterial = stalkMaterial(0xFF0000);
    const yMaterial = stalkMaterial(0x00FF00);
    const zMaterial = stalkMaterial(0x0000FF);

    // Stalks
    const stalk = () => new THREE.CylinderGeometry(0.075, 0.075, stalkLength);
    const xStalkGeometry = stalk();
    const yStalkGeometry = stalk();
    const zStalkGeometry = stalk();
    
    const xStalk = new THREE.Mesh(xStalkGeometry, xMaterial);
    const yStalk = new THREE.Mesh(yStalkGeometry, yMaterial);
    const zStalk = new THREE.Mesh(zStalkGeometry, zMaterial);

    xStalk.renderOrder =
    yStalk.renderOrder =
    zStalk.renderOrder = 1;

    xStalk.position.x =
    yStalk.position.y =
    zStalk.position.z = stalkLength / 2;

    xStalk.rotation.z = Math.PI / 2;
    zStalk.rotation.x = Math.PI / 2;
    
    transformGizmo.add(xStalk);
    transformGizmo.add(yStalk);
    transformGizmo.add(zStalk);
    
    // End cones
    const coneGeometry = new THREE.ConeGeometry(0.25, 0.5);
    
    const xCone = new THREE.Mesh(coneGeometry, xMaterial);
    const yCone = new THREE.Mesh(coneGeometry, yMaterial);
    const zCone = new THREE.Mesh(coneGeometry, zMaterial);

    xCone.renderOrder =
    yCone.renderOrder =
    zCone.renderOrder = 1;

    xCone.position.x =
    yCone.position.y = 
    zCone.position.z = stalkLength;
    
    xCone.rotation.z = -Math.PI / 2;
    zCone.rotation.x = Math.PI / 2;

    transformGizmo.add(xCone);
    transformGizmo.add(yCone);
    transformGizmo.add(zCone);

    return transformGizmo;
}

// Populate the UI with the transform values of the selected object
export function PopulateTransforms(object) {
    const transformInputs = document.getElementsByClassName("transform-input");
    
    transformInputs[0].value = object.position.x;
    transformInputs[1].value = object.position.y;
    transformInputs[2].value = object.position.z;
    transformInputs[3].value = object.rotation.x;
    transformInputs[4].value = object.rotation.y;
    transformInputs[5].value = object.rotation.z;
    transformInputs[6].value = object.scale.x;
    transformInputs[7].value = object.scale.y;
    transformInputs[8].value = object.scale.z;
}

// Apply the transform values to the selected object from the UI
export function UpdateTransforms(object) {
    const transformInputs = document.getElementsByClassName("transform-input");
    
    object.position.x = transformInputs[0].value;
    object.position.y = transformInputs[1].value;
    object.position.z = transformInputs[2].value;
    object.rotation.x = transformInputs[3].value;
    object.rotation.y = transformInputs[4].value;
    object.rotation.z = transformInputs[5].value;
    object.scale.x = transformInputs[6].value;
    object.scale.y = transformInputs[7].value;
    object.scale.z = transformInputs[8].value;
}

// Get the object under the mouse pointer
export function GetHit(raycaster, mouse, camera, scene) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(scene, true);
    return hits.length > 0 ? hits[0].object : null;
}

// Get the geometry corresponding to the selected primitive
export function GetGeometry(dropdownValue) {
    /*
        Before, the following was used to get the geometry: 
        const call = `new THREE.${dropdownValue}Geometry()`;
        return eval(call);
        However this prodedural approach meant that the bundler could not 
        find the methods at runtime due to the tree shaking at compile time 
        as they were not present in the code.
        This method includes all the functions 
        that could be needed at runtime so they are bundled.
    */
    switch (dropdownValue) {
        case "Box":
            return new THREE.BoxGeometry();
        case "Circle":
           return new THREE.CircleGeometry();
        case "Cone":
           return new THREE.ConeGeometry();
        case "Cylinder":
           return new THREE.CylinderGeometry();
        case "Dodecahedron":
           return new THREE.DodecahedronGeometry();
        case "Icosahedron":
           return new THREE.IcosahedronGeometry();
        case "Octahedron":
           return new THREE.OctahedronGeometry();
        case "Plane":
           return new THREE.PlaneGeometry();
        case "Ring":
           return new THREE.RingGeometry();
        case "Sphere":
           return new THREE.SphereGeometry();
        case "Tetrahedron":
           return new THREE.TetrahedronGeometry();
        case "Torus":
           return new THREE.TorusGeometry(1, 0.4, 8, 32, Math.PI * 2);
        case "TorusKnot":
           return new THREE.TorusKnotGeometry();
        case "Tube":
           return new THREE.TubeGeometry();
    }
}

/*
    Construct a new scene object
    GetGeometry is passed as a parameter to ensure every Util function can be used independently
*/
export function CreateShape(shape, material, getGeometry) {
    const geometry = getGeometry(shape);
    const obj = new THREE.Mesh(geometry, material);

    // Set the object's default name to the geometry's type
    obj.name = shape;

    // Convert the name to lowercase
    obj.name = obj.name.toLowerCase();

    // Remove all whitespace in the name
    obj.name = obj.name.replace(/ /g, '');

    /*
        If the object name starts with a number, 
        prepend it with a non-numeric character.
        This ensures it is a valid javascript variable name.
    */
    if (obj.name.match(/^\d/)) obj.name = '_' + obj.name;

    /*
        Allows differentiation of user-added objects 
        versus objects added by the editor,
        for example transform gizmos.
    */
    obj.userData.sceneObject = true;

    obj.userData.type = shape;

    return obj
}

const boilerplateCode = [
    `// The object that is parent to all the objects in the scene`,
    `const scene = new THREE.Scene();`,
    ``,
    `// The camera determines what is rendered in the scene`,
    `const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);`,
    ``,
    `// The renderer draws 3D objects onto the canvas`,
    `const renderer = new THREE.WebGLRenderer({ antialias: true });`,
    `renderer.setSize(window.innerWidth, window.innerHeight);`,
    `// The clear color is the background color of the scene`,
    `renderer.setClearColor(new THREE.Color("black"), 1);`,
    ``,
    `// Add the renderer to the DOM`,
    `document.body.appendChild(renderer.domElement);`,
    ``,
    `// Add a light`,
    `const light = new THREE.AmbientLight(0xffffff);`,
    `scene.add(light);`, 
    `\n`      
];
const importsCode = [
    `import * as THREE from "https://cdn.skypack.dev/three"`,
    `\n`
];

// Replace the existing output code in the code view with newly generated code
export function GenerateCode(ignoredUUIDs, scene, showImports, showBoilerplate, hljs) {
    const sceneCode = [];
    
    scene.children.forEach(child => {
        if (ignoredUUIDs.some(ignoredUUID => ignoredUUID === child.uuid)) return;
        if (child.userData.gizmo) return;

        const line = `\
const ${child.name}Geometry = new THREE.${child.geometry.type}();
const ${child.name}Material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); 
const ${child.name} = \
new ${child.type}();
${child.name}.position.set(\
${child.position.x}, \
${child.position.y}, \
${child.position.z});
${child.name}.rotation.set(\
${child.rotation.x}, \
${child.rotation.y}, \
${child.rotation.z});
${child.name}.scale.set(\
${child.scale.x}, \
${child.scale.y}, \
${child.scale.z});
scene.add(${child.name});
`;
        sceneCode.push(line);
    });

    const codeView = document.getElementById("code");

    // Clear the code view
    codeView.innerHTML = "";

    if (showImports) codeView.innerHTML += importsCode.join('\n');
    if (showBoilerplate) codeView.innerHTML += boilerplateCode.join('\n');

    // Add the scene code to the code view
    codeView.innerHTML += sceneCode.join('\n');

    // Syntax highlighting
    hljs.highlightAll()
}