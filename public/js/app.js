import { Scene, WebGLRenderer, GridHelper, DirectionalLight, AmbientLight, Raycaster, Vector2, MeshLambertMaterial } from "three";
import { PerspectiveCamera } from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls" 
import { IFCLoader } from "web-ifc-three/IFCLoader";
import {computeBoundsTree , acceleratedRaycast, disposeBoundsTree} from "three-mesh-bvh";

const scene = new Scene();
const size = {
    width: window.innerWidth,
    height: window.innerHeight, 
}
const canvas = document.querySelector("#three-canvas");

const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

console.log("AMit");
console.log(size.width);
const renderer = new WebGLRenderer({canvas: canvas, alpha:true})
renderer.setSize(size.width,size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const grid = new GridHelper(50, 30);
scene.add(grid);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  
  animate();

//loadng ifc data
const ifcModels = []
const ifc = new IFCLoader();
ifc.ifcManager.setWasmPath("./");

const input = document.getElementById("ifc-data");
const visualBtn = document.getElementById("visual-btn");
var ifcURL = null;
  input.addEventListener(
    "change",
    (changed) => {
       ifcURL = URL.createObjectURL(changed.target.files[0]);
    },
    false
  );
  visualBtn.addEventListener("click", ()=>{
    ifc.load(ifcURL, (ifcModel) => {
      ifcModels.push(ifcModel.mesh)
      scene.add(ifcModel.mesh)
    });
  })

  ifc.ifcManager.setupThreeMeshBVH(
    computeBoundsTree,
    disposeBoundsTree,
    acceleratedRaycast
  );

  const rayCaster = new Raycaster();
  rayCaster.firstHitOnly = true;
  const mousePoint = new Vector2();

  function casting(event){
    const bounds = canvas.getBoundingClientRect();

    const x1 = event.clientX - bounds.left;
    const x2 = bounds.right - bounds.left;
    mousePoint.x = (x1 / x2) * 2 - 1;

    const y1 = event.clientY - bounds.top;
    const y2 = bounds.bottom - bounds.top;
    mousePoint.y = -(y1 / y2) * 2 + 1;

    rayCaster.setFromCamera(mousePoint, camera);

    
    return rayCaster.intersectObjects(ifcModels);
}

const prevSelect = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.5,
  color: 0xff88ff,
  depthTest: false
})
const select = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.5,
  color: 0xff00ff,
  depthTest: false
})

const modelFocus = {id: -1}
const modelSelect = {id: -1}

function focus (event,material, model, multiple = true ){
  const isFound = casting(event)[0];
  if (isFound){
    model.id = isFound.object.modelID;

    const index = isFound.faceIndex;
    const geometry = isFound.object.geometry;
    const id = ifc.ifcManager.getExpressId(geometry, index);

    ifc.ifcManager.createSubset({
      modelID: model.id,
      ids: [id],
      material: material,
      scene: scene,
      removePrevious: multiple,
    })

  }else{
    ifc.ifcManager.removeSubset(model.id, scene, material);
  }
}

window.onmousemove = (event) => focus(event, prevSelect, modelFocus);

window.ondblclick = (event) => focus(event, select, modelSelect);

 


