import React, { Component } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';
const TWEEN = require('three-tween')

import OrbitControls from './orbitControls.js';

import DropZone from './DropZone';

const devmode = false;

var texturemissing = false;

const FileViewerWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-Index: 1;
`;

const TextButton = styled.div`
      color: #fff;
      width: 200px;
      z-Index: 2;
      border-Radius: 50px;
      position: absolute;
      top: 0;
      left: 20px;
      background: linear-gradient( 52deg ,rgb(26 34 48 / 48%) 0%,rgb(52 86 119 / 32%) 100%);
      padding-top: 6px;
      padding-bottom: 6px;
      padding-right: 12px;
      padding-left: 12px;
      text-align: center;
    &: hover {
    cursor: pointer;
`;

const NewUploadBtn = styled.div`
  position: absolute;
  height: 40px;
  width: 40px;
  border-radius:50%;
  font-size: 26px;
  padding-bottom: 3px;  
  margin: 2% 90%;
  color: white;
  background: linear-gradient( 52deg ,rgb(26 34 48 / 48%) 0%,rgb(52 86 119 / 32%) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  &: hover {
    cursor: pointer;
`;

const LoadingSpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90%;
`;

const Loadingdiv = styled.div`
  display: block;
  position: absolute;
  width: 0px;
  z-Index: 10;
  height: 5px;
  background: linear-gradient( 52deg ,rgb(26 34 48 / 48%) 0%,rgb(52 86 119 / 32%) 100%);
  bottom: 0px;
`;

const Loadingdivperc = styled.div`
  background-color: transparent;
  position: absolute;
  left: 0px;
  width: 50px;
  height: 50px;
  bottom: -30px;
  font-size: 10px;
`

// - -  SYNTAX BREAK - - - -

class FileViewer extends Component {
  constructor() {
    super();
    window.FileViewerComponent = this;
    this.state = {
      isModel: false,
      isLoading: false,
      hashelper: false
    };
  }
  componentDidUpdate(prevProps) {
    console.log('componentDidUpdate');
    if (this.props.filePath && prevProps.filePath !== this.props.filePath) {
      this.loadObject(this.props.filePath);
    }
  }

  componentDidMount() {

    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
        
    window.addEventListener("resize", this.updateDimensions);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera( 45, this.mount.clientWidth / this.mount.clientHeight, 0.1, 3000, );
    this.camera.aspect = 2.6;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (devmode==true) {
      this.renderer.setClearColor(0xff0000, 1);
    }else{
      this.renderer.setClearColor(0xff0000, 0);
    }

    this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);

    this.ocontrols = new OrbitControls(this.camera, this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight( 0xffffff, .3 );
    this.scene.add( this.ambientLight );

    this.spotLight = new THREE.SpotLight( 0xF3F7FA, 1 );
    this.spotLight.position.set( 100, 500, 100 );
    this.spotLight.angle = 1;
    this.spotLight.penumbra = 0.5;
    this.spotLight.decay = .1;
    this.spotLight.distance = 2000;
    this.spotLight.castShadow = true;
    this.spotLight.target.position.set( 3, 0, - 3 );
    this.scene.add( this.spotLight.target );        
    this.scene.add( this.spotLight );

    this.originalObject;
    this.model;
    this.modelImageDataURL;

    this.optimizationLevel = 1;
    this.loading = false;
    this.modelisready = false;
    this.scale = .1;
    this.rotationspeed = 0;

    this.showbox = false;
    this.showgrid = false;
    this.addFloor = false;
    this.showwireframe = false;
    this.xraymode = false;

    this.errorarray = [];

    this.box;
    this.grid;

    this.animationtimer = 2000;

    localStorage.startTime = Date.now();
    localStorage.stopEverything = 'true';
    setTimeout(() => {
      localStorage.stopEverything = 'false';
      requestAnimationFrame(this.renderScene);
    }, 500);

    this.mount.appendChild(this.renderer.domElement);
  }

  setLoading = () => {
    this.setState({ isLoading: true });
    this.scene.remove(this.model);
  };

  clearScene = () => {

    this.camera.position.set(0,0,0);
    this.ocontrols.target.set(0, 0, -1);

    document.getElementById("canvas").style.zIndex = "0";
    document.getElementById("loadingdiv").style.width = '0px';
    document.getElementById("loadingdiv").style.display = 'none';
    document.getElementById("loadingdivperc").innerHTML = 0+'%';
    document.getElementById("loadingdivperc").style.display = 'none';
    document.getElementById("loadingdivperc").style.marginLeft = 0+'%';

    this.showbox = false;
    this.showgrid = false;
    this.addFloor = false;
    this.showwireframe = false;
    this.xraymode = false;

    this.scene.remove(this.box)
    this.scene.remove(this.grid)
    this.scene.remove(this.floor)

    this.setState({ isModel: false });
    this.scene.remove(this.model);
    this.props.setIsSceneEmpty(true);
    console.log("more")
  };

  success = incfile => {
    var success_value = "Great news!, your " + incfile + " file is ready to view";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_success_indicator'}>✓</div>
          <div className={'toast_success'}>{success_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  textobjsuccess = incfile => {
    var textobjsuccess_value = "Great news!, your Obj file is ready to view";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_success_indicator'}>✓</div>
          <div className={'toast_success'}>{textobjsuccess_value}</div>
        </div>
      );
  }

  // - - - SYNTAX BREAK

  loadingprogress = incfile => {
    document.getElementById("loadingdiv").style.display = 'block';
    document.getElementById("loadingdiv").style.width = incfile+'%';
    document.getElementById("loadingdivperc").style.display = 'block';
    document.getElementById("loadingdivperc").innerHTML = incfile+'%';
    document.getElementById("loadingdivperc").style.marginLeft = incfile-3+'%';
    console.log(incfile)
  }

    // - -  SYNTAX BREAK

  error = incfile => {

    setTimeout(() => {
      this.setState({ isLoading: false });
    },1000);

    this.ocontrols.target.set(0, 0, -1);

    document.getElementById("canvas").style.zIndex = "0"

    this.showbox = false;
    this.showgrid = false;
    this.addFloor = false;
    this.showwireframe = false;
    this.xraymode = false;

    this.scene.remove(this.box)
    this.scene.remove(this.grid)
    this.scene.remove(this.floor)
// 
    this.setState({ isModel: false });
    this.scene.remove(this.model);
    this.props.setIsSceneEmpty(true);

    var error_value = "Super duper sorry, " + incfile+" files aren't yet supported!";
    toast(({ closeToast }) => 
        <div className={'toast_error'}>
          <div className={'toast_error_indicator'}>✕</div>
          {error_value}
        </div>
      );
  }

  // - -  SYNTAX BREAK

  largefileinfo = incfile => {
    var largefileinfo_value = "This seems like a very large file - it may take a few seconds to load!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_info_indicator'}>i</div>
          <div className={'toast_info'}>{largefileinfo_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  fbxtextureissue_id = incfile => {

    setTimeout(() => {
      this.setState({ isLoading: false });
    },1000);

    var fbxtextureissue_id_value = "Very sorry - It seems there's an integral texture ID/name incorrectly named within the file!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_error_indicator'}>i</div>
          <div className={'toast_info'}>{fbxtextureissue_id_value}</div>
        </div>
      );

    texturemissing=true;

  }

  // - -  SYNTAX BREAK

  general_texture_error = incfile => {
    var general_texture_error_value = "Very sorry! - There's a broken or missing texture file with this upload!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_error_indicator'}>i</div>
          <div className={'toast_info'}>{general_texture_error_value}</div>
        </div>
      );
    texturemissing=true;
  }

  // - -  SYNTAX BREAK

  fbxtextureissue = incfile => {

    var fbxtextureissue_value = "It seems you're missing some integral texture files so we've loaded the file in with a generic texture for now!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_error_indicator'}>i</div>
          <div className={'toast_info'}>{fbxtextureissue_value}</div>
        </div>
      );

    texturemissing=true;

  }

  // - -  SYNTAX BREAK

  gltfbinerror = incfile => {

    setTimeout(() => {
      this.setState({ isLoading: false });
    },1000);

    document.getElementById("canvas").style.zIndex = "0"

    var infogltfbinerror_value = "It seems you're missing a .bin and potential other files from your gltf upload!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_error_indicator'}>i</div>
          <div className={'toast_info'}>{infogltfbinerror_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  bininfo = incfile => {
    var bininfo_value = "A quick note, " +incfile+" files can be used only accompanying gltf files";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_info_indicator'}>i</div>
          <div className={'toast_info'}>{bininfo_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  info = incfile => {
    var info_value = "A quick note, " +incfile+" files can be used only as textures for models";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_info_indicator'}>i</div>
          <div className={'toast_info'}>{info_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  fbxtextureerror = incfile => {

    setTimeout(() => {
      this.setState({ isLoading: false });
    },1000);

    var fbxtextureerror_value = "It seems your FBX texture is missing some integral texture files!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_error_indicator'}>✕</div>
          <div className={'toast_error'}>{fbxtextureerror_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  mtlerror = incfile => {
    var mtlerror_value = "Texture missing: Please check your upload contains all image files for textures";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_error_indicator'}>✕</div>
          <div className={'toast_mtlerror'}>{mtlerror_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  mtlissue = incfile => {
    var mtlissue_value = "Texture missing: Your OBJ may have an MTL to upload with it!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_info_indicator'}>i</div>
          <div className={'toast_mtlissue'}>{mtlissue_value}</div>
        </div>
      );
  }


  // - -  SYNTAX BREAK

  imageonlyissue = incfile => {
    var imageonlyissue_value = "It seems you've forgotten your MTL file with your images textures!";
    toast(({ closeToast }) => 
        <div>
          <div className={'toast_info_indicator'}>i</div>
          <div className={'toast_imageonlyissue'}>{imageonlyissue_value}</div>
        </div>
      );
  }

  // - -  SYNTAX BREAK

  setupNewObject = obj => {

    this.showbox = false;
    this.showgrid = false;
    this.addFloor = false;
    this.showwireframe = false;
    this.xraymode = false;

    this.scene.remove(this.box)
    this.scene.remove(this.grid)
    this.scene.remove(this.floor)

    this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);

    this.setState({ isModel: true, isLoading: false });

    document.getElementById("canvas").style.zIndex = "1"

    document.getElementById("addboxhelper").innerHTML = "Add Helper";
    document.getElementById("addgridhelper").innerHTML = "Add Grid";
    document.getElementById("addshadows").innerHTML = "Add Shadows";
    document.getElementById("addwireframe").innerHTML = "Show Wireframe";
    document.getElementById("addxray").innerHTML = "X-Ray mode";

    console.log('setupNewObject');
    this.scene.remove(this.model);
    this.model = obj;
    this.model.rotation.y-=Math.PI;

    const modelsize = new THREE.Box3();
    modelsize.expandByObject(this.model);
    const modelsize3 = modelsize.getSize(new THREE.Vector3());

    if (modelsize3.z>modelsize3.x) {
      this.gridsize = modelsize3.z;
    }else{
      this.gridsize = modelsize3.x;
    }
    this.griddivisions = 10;

    this.box = new THREE.BoxHelper( this.model, 0xFF00FF );
    this.grid  = new THREE.GridHelper( this.gridsize, this.griddivisions );

    this.fitCameraToObject(1);

    this.model.scale.set( 0, 0, 0);

    const initialrotation = new TWEEN.Tween(this.model.rotation)
        .to({ y: "+" + 0}, this.animationtimer)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(0)
        .start();

    var es = { x : 1, y: 1, z: 1 };
    var scaletween = new TWEEN.Tween(this.model.scale)
        .to(es, this.animationtimer)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

        this.model.castShadow = true;
        this.model.receiveShadow = true;

        this.rotationspeed = 0.001;

        if (texturemissing==true) {
          var m = new THREE.MeshPhongMaterial({ color: 0x222222 })
          this.model.traverse(function(child){
            child.material = m;
          })
        }else{

        }

        this.scene.add(this.model);

        const planeGeometry = new THREE.PlaneGeometry( 1, 1 );
        const planeMaterial = new THREE.ShadowMaterial({ color: 0x222222, transparent: true, opacity: 0.3 })

        this.floor = new THREE.Mesh( planeGeometry, planeMaterial );
        this.floor.rotation.x = - Math.PI / 2;
        this.floor.position.z = - 5;
        this.floor.scale.multiplyScalar( 3 );
        this.floor.castShadow = true;
        this.floor.receiveShadow = true;
        this.floor.castShadow = true;
        this.floor.receiveShadow = true;

        this.floor.scale.set(modelsize3.x+5000,modelsize3.z+5000)

    setTimeout(() => {
        this.modelImageDataURL = this.renderer.domElement.toDataURL();
        this.props.setModelImageDataURL(this.modelImageDataURL)
    }, 100);

      document.getElementById("addboxhelper").style.top = "20px"
      document.getElementById("addgridhelper").style.top = "60px"
      document.getElementById("addshadows").style.top = "100px"
      document.getElementById("addwireframe").style.top = "140px"
      document.getElementById("addxray").style.top = "180px"

    this.props.setIsSceneEmpty(false);
    this.props.setModel(this.model)

    setTimeout(() => {
      this.modelisready = true;
    },this.animationtimer)
  };

  updateDimensions = () => {
      if (this.mount !== null) {
          this.renderer.setSize(
              this.mount.clientWidth,
              this.mount.clientHeight
          );
          this.camera.aspect =
              this.mount.clientWidth / this.mount.clientHeight;
          this.camera.updateProjectionMatrix();
      }
  }

  BoxHelper = () => {
    this.showbox = !this.showbox;
      if (this.showbox == true) {
        this.scene.add(this.box)
        document.getElementById("addboxhelper").innerHTML = "Remove Helper";
      } 
      if (this.showbox == false) {
        this.scene.remove(this.box)
        document.getElementById("addboxhelper").innerHTML = "Add Helper";
      }
  }

  GridHelper = () => {
    this.showgrid = !this.showgrid;
      if (this.showgrid == true) {
        this.scene.add(this.grid)
        document.getElementById("addgridhelper").innerHTML = "Remove Grid";
      } 
      if (this.showgrid == false) {
        this.scene.remove(this.grid)
        document.getElementById("addgridhelper").innerHTML = "Add Grid";
      }
  }

  AddShadows = () => {
    this.addFloor = !this.addFloor;
      if (this.addFloor == true) {
          this.scene.add(this.floor);
        document.getElementById("addshadows").innerHTML = "Remove Shadows";
      } 
      if (this.addFloor == false) {
          this.scene.remove(this.floor);
        document.getElementById("addshadows").innerHTML = "Add Shadows";
      }
  }

  AddWireframe = () => {
    this.showwireframe = !this.showwireframe;
      if (this.showwireframe == true) {
          this.model.traverse(function(child){
              if ( child.isMesh ) { 
                    child.material.wireframe = true;
                    child.material.transparent = true;
                 }
            }  );
        document.getElementById("addwireframe").innerHTML = "Hide Wireframe";
      } 
      if (this.showwireframe == false) {
          this.model.traverse(function(child){
              if ( child.isMesh ) { 
                    child.material.wireframe = false;
                    child.material.transparent = true;
                 }
            }  );
          document.getElementById("addwireframe").innerHTML = "Show Wireframe";
          document.getElementById("addxray").innerHTML = "X-Ray mode";
    }
  }

  AddXray = () => {
    this.xraymode = !this.xraymode;
      if (this.xraymode == true) {
            this.model.traverse( function ( child ) {
              if ( child.isMesh ) { 
                    child.material.opacity = .5;
                    child.material.transparent = true;
                 }
            }  );
      document.getElementById("addxray").innerHTML = "Colour mode";
    } 
      if (this.xraymode == false) {
            this.model.traverse( function ( child ) {
              if ( child.isMesh ) { 
                    child.material.opacity = 1;
                    child.material.transparent = true;
                 }
            }  );
      document.getElementById("addxray").innerHTML = "X-Ray mode";
    }
  }

  fitCameraToObject = fitOffset => {
    this.ocontrols.target.set(0, 0, -1);

    this.ocontrols.enablePan = true;

    const box = new THREE.Box3();
    box.expandByObject(this.model);

    console.log( box.min, box.max );

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const gridbox = new THREE.Box3();
    gridbox.expandByObject(this.grid);

    const gridcenter = gridbox.getCenter(new THREE.Vector3());

    // console.log(gridcenter)

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * this.camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / this.camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = this.ocontrols.target
      .clone()
      .sub(this.camera.position)
      .normalize()
      .multiplyScalar(distance);

    this.ocontrols.maxDistance = distance * 10;
    this.ocontrols.minDistance = distance / 2;
    // this.ocontrols.target.copy(gridcenter);
    
    this.ocontrols.target.set(0, -1+(distance*.15), 0);

    this.ocontrols.enableZoom = true;
    this.camera.near = distance / 100;
    this.camera.far = distance * 100;
   
    this.camera.position.copy(this.ocontrols.target).sub(direction);
    
    this.camera.position.y = (distance);
    this.camera.position.z = (distance+(distance/2));
    this.spotLight.position.y = fitHeightDistance+100;

    this.ocontrols.update();

  };

  exportAsGLTF = () => {
    this.props.exportAsGLTF(modelClone);
  };

  renderScene = () => {
    if (this.modelisready==true) {
        this.model.rotation.y += this.rotationspeed;
        this.grid.rotation.y += this.rotationspeed;
        this.box.update();
    }

    TWEEN.update();
    requestAnimationFrame(this.renderScene);
    this.renderer.render(this.scene, this.camera);
  };

  render() {

    const notify = () => toast("Wow so easy!");

    return (

      <FileViewerWrapper>

      <div>
        <ToastContainer/>
      </div>

      <Loadingdiv id="loadingdiv" Loadingdiv/>
      <Loadingdivperc id="loadingdivperc" Loadingdivperc/>

      {this.state.isLoading
        && <LoadingSpinnerWrapper>
          <div className="loading-spinner">
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </LoadingSpinnerWrapper>
      }

      {this.state.isModel && <NewUploadBtn style={{ zIndex: '2' }} onClick={this.clearScene}>+</NewUploadBtn>}

      {this.state.isModel && <TextButton id="addboxhelper" onClick={this.BoxHelper}>Add Helper</TextButton>}
      {this.state.isModel && <TextButton id="addgridhelper" onClick={this.GridHelper}>Add Grid</TextButton>}
      {this.state.isModel && <TextButton id="addshadows" onClick={this.AddShadows}>Add Shadows</TextButton>}
      {this.state.isModel && <TextButton id="addwireframe" onClick={this.AddWireframe}>Show Wireframe</TextButton>}
      {this.state.isModel && <TextButton id="addxray" onClick={this.AddXray}>X-Ray mode</TextButton>}

      <div id="canvas" style={{ position: 'absolute', width: '100%', height: '100%' }} ref={mount => { this.mount = mount; }}/>

        <DropZone style={{ position: 'absolute', width: '100%', height: '100%' }}
          isLoading={this.state.isLoading}
          active={this.state.isModel}
        />

      </FileViewerWrapper>
    );
  }
}

export default FileViewer;
