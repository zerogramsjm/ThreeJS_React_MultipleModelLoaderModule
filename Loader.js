import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import * as THREE from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader_logger.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader_logger.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AMFLoader } from 'three/examples/jsm/loaders/AMFLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { MD2Loader } from 'three/examples/jsm/loaders/MD2Loader.js';
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader.js';
import { VTKLoader } from 'three/examples/jsm/loaders/VTKLoader.js';
import { VOXLoader } from 'three/examples/jsm/loaders/VOXLoader.js';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader.js';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';

import * as JSZip from 'jszip';

const dae_texture = 0x222222;
const obj_fbx_3ds_texture = 0x222222;

const dm = 0.800000011920929;

var object;

var failedextensions = []
const alreadySeen = [];

var c=0;

var textureissuec;

var jpgc, pngc, ddsc, txtc, htmlc, jsc, bvhc, tmfc, assimpc, gcodec, nac, binc;

var largec;

let manager, objFilename, mtlFilename, pngFilename;

const loaded = [];

var mtlerrorcount, mtlissuecount, textobjsuccesscount;

var Loader = function(onLoad) {

  const lbox = new THREE.Box3();

  jpgc = 0;
  pngc = 0;
  ddsc = 0;
  txtc = 0;
  htmlc = 0;
  jsc = 0;
  bvhc = 0;
  tmfc = 0;
  assimpc = 0;
  gcodec = 0;
  nac = 0;
  binc = 0;
  largec = 0;
  
  textureissuec = 0;

  var scope = this;

  var percentComplete = 0;
  var prog;

  this.texturePath = '';
  const fileSizeLoadingThresh = 300000;

  this.loadFiles = function(files) {
    loaded.push(files);
    let largestFileSize = 0;
    console.log('files: ', files);
    if (files.length > 0) {
      var filesMap = createFileMap(files);
      var manager = new THREE.LoadingManager();
      manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
        percentComplete = 5;
        window.FileViewerComponent.loadingprogress(prog);
      };
      manager.onLoad = function ( ) {
      };
      manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        percentComplete = itemsLoaded / itemsTotal * 100;
        prog = Math.round(percentComplete, 2)
        window.FileViewerComponent.loadingprogress(prog);
      };
      manager.onError = function ( url ) {
        console.log( 'There was an error loading ' + url );
        if (textureissuec==0) {
          window.FileViewerComponent.general_texture_error();
          textureissuec=1;
        }
      };
      manager.setURLModifier(function(url) {
        var file = filesMap[url];

        if (file) {
          return URL.createObjectURL(file);
        }
        return url;
      });

      for (var i = 0; i < files.length; i++) {
        const fileExt = files[i].name.substr(
          files[i].name.lastIndexOf('.') + 1,
          (largestFileSize =
            files[i].size > largestFileSize ? files[i].size : largestFileSize),
        );

        var fel = fileExt.toLowerCase();
        if (fel === 'obj'||fel === 'mtl') {
          scope.loadObj(files, fel);
          } else {
          for (var i = 0; i < files.length; i++) {
            scope.loadFile(files[i], manager);
          }
        }
      }
      if (largestFileSize > fileSizeLoadingThresh) {
        window.FileViewerComponent.setLoading();
      }
    }
  };

  this.loadObj = function(files) {
    objFilename;
    mtlFilename;
    var folderloc;
    const urlMap = {};

    var subfoldermtl = false;
    var psc, pscr;

    var ext;
    var blobp;

    let mtlfound = false;
    let imagefound = false;
    let hasnormalmap = false;

    let normalfilename;

    let firstload = 0;
    let iif = 0;

    var pathstring;

    manager = new THREE.LoadingManager();
    manager.setURLModifier(url => urlMap[url]);

    files.forEach(blob => {

      blobp = blob;

      pathstring = blob.path;

      urlMap[blobp.path] = URL.createObjectURL(blobp);

      ext = blobp.path.substr(blobp.path.lastIndexOf('.') + 1);

      if (ext == 'obj') {
        objFilename = blobp.path;
        console.log("obj")
      }
      if (ext == 'mtl') {
        mtlFilename = blobp.path;
        console.log("mtl")
        mtlfound=true;
      }
      if (ext == 'png'||ext == 'jpg'||ext == 'dds'){
          if(pathstring.includes("/")) {
          folderloc = blobp.path;
          subfoldermtl = true;
        }else{
          folderloc = blobp.path;
          subfoldermtl = true;
        }
        if (mtlfound==true) {
            console.log("mtl & images uploaded")
        }else{
            console.log("only images uploaded")
            if (iif==0) {
              window.FileViewerComponent.imageonlyissue();
              iif=1;
            }
        }
      }
      var nstring = "Normal";
      if (ext=="png"||ext=="jpg"||ext=="dds") {
        if (pathstring.includes(nstring)) {
          console.log("image texture is a normal")
          normalfilename = blobp.path;
          hasnormalmap=true;
        }
      }
    });

    // IF AN OBJ IS LOADED WITH MTL AND IMAGE TEXTURES IN A SUBDIRECTORY  - - - - - - - - - 

      if (files.length>1&&subfoldermtl==true){
        var textureLoader = new THREE.TextureLoader(manager);
        var map = textureLoader.load(folderloc);
        var material = new THREE.MeshPhongMaterial({map: map});
        var loader = new OBJLoader(manager);
        loader.load( objFilename, function ( object ) {
          object.traverse( function ( child ) {
            if ( child.isMesh ) 
              child.material = material;
              child.castShadow = true;
          } );
          window.FileViewerComponent.setupNewObject(object);
        }, onProgress );
      }

    // IF ONLY AN OBJ WITH NO MTL OR IMAGE TEXTURES - - - - - - - - - - - - - - - - - - - 

      if (files.length==1&&subfoldermtl==false){
        mtlissuecount = 0;
        if (ext=='obj'||ext=='mtl'){
          objFilename = blobp.path;
          mtlFilename = blobp.path;
        }
        if (ext == 'jpg'||ext == 'png') {
          imagefound = true;
        }
        var mtlLoader = new MTLLoader(manager);
        var mtlmat = new THREE.MeshPhongMaterial({ color: obj_fbx_3ds_texture });
        mtlLoader.load(mtlFilename, materials => {
        materials.preload();
        for (const material of Object.values(materials.materials)) {
            material.side = THREE.DoubleSide;
        }
            var objLoader = new OBJLoader(manager);
            if (imagefound==true) {
              // objLoader.setMaterials(materials);
            }else{
              objLoader.setMaterials(materials);
            }
            objLoader.load(objFilename, object => {
              if (firstload==0) {
                object.name = objFilename;
                  object.traverse( function(child) {
                      child.castShadow = true;
                              child.material = mtlmat;
                  })
                if (mtlissuecount==0) {
                    window.FileViewerComponent.mtlissue();
                    mtlissuecount=1;
                }
                window.FileViewerComponent.setupNewObject(object);
                firstload=1;
              }
          }, onProgress );
        });
      }

    // IF AN OBJ WITH MTL AND IMAGE TEXTURES BUT NO NORMAL MAP - - - - - - - - - - - - - - - - - - - - - - - 

    if (files.length>1&&subfoldermtl==false&&hasnormalmap==false){
      mtlerrorcount = 0;
      textobjsuccesscount = 0;
      var mtlLoader = new MTLLoader(manager);
      mtlLoader.setPath();
      mtlLoader.load(mtlFilename, materials => {
          materials.preload();
          var objLoader = new OBJLoader(manager);
          objLoader.setMaterials(materials);
          objLoader.load(objFilename, object => {
            object.name = objFilename;
            object.traverse(function(child){
              child.castShadow = true;
            })
            window.FileViewerComponent.setupNewObject(object);
            if (textobjsuccesscount==0) {
              window.FileViewerComponent.textobjsuccess();
              textobjsuccesscount=1;
            }
          }, onProgress,this.onError);
        }, function ( xhr ) {},this.onMTLError);
    }

    // IF AN OBJ WITH MTL AND IMAGE TEXTURES AND NORMAL MAP - - - - - - - - - - - - - - - - - - - - - - - 

    if (files.length>1&&subfoldermtl==false&&hasnormalmap==true){
      mtlerrorcount = 0;
      textobjsuccesscount = 0;
      var normalmap = textureLoader.load(normalfilename);
      var normalmaterial = new THREE.MeshPhongMaterial({map: normalmap});
      var mtlLoader = new MTLLoader(manager);
      mtlLoader.setPath();
      mtlLoader.load(mtlFilename, materials => {
          materials.preload();
          var objLoader = new OBJLoader(manager);
          objLoader.setMaterials(materials);
          objLoader.load(objFilename, object => {
            object.name = objFilename;
            object.traverse(function(child){
              child.normalMap = normalmap;
              child.castShadow = true;
            })
            window.FileViewerComponent.setupNewObject(object);
            if (textobjsuccesscount==0) {
              window.FileViewerComponent.textobjsuccess();
              textobjsuccesscount=1;
            }
          }, onProgress,this.onError);
        }, function ( xhr ) {},this.onMTLError);
    }
  };

  // IF AN OBJ WITH MTL AND LOST/NO IMAGE TEXTURES - - - - - - - - - - - - - - - - - - - - 

  this.onMTLError = function(){
    var mtlmat = new THREE.MeshPhongMaterial({ color: obj_fbx_3ds_texture });
    var objLoader = new OBJLoader(manager);
      objLoader.load(objFilename, object => {
        object.name = objFilename;
        object.traverse( function(child) {
              child.castShadow = true;
              child.material = mtlmat;
          })
        if (mtlerrorcount==0) {
            window.FileViewerComponent.mtlerror();
            mtlerrorcount=1;
        }
        window.FileViewerComponent.setupNewObject(object);
      }, onProgress)
  }

  this.onError = function(){
    console.log("OBJ ERROR")
  }

  this.loadFile = function(file, manager) {
    var filename = file.name;
    console.log('filename: ', filename);
    var extension = filename.split('.').pop().toLowerCase();
    console.log('extension: ', extension);
    var reader = new FileReader();
    console.log(filename)
    reader.addEventListener('progress', function(event) {
      var size = '(' + Math.floor(event.total / 1000).toFixed(2) + ' KB)';
      if (Math.floor(event.total / 1000).toFixed(2)>100000) {
        console.log("BIG");
        if (largec == 0) {
          window.FileViewerComponent.largefileinfo();
          largec = 1;
        }
      }
      var progress = Math.floor((event.loaded / event.total) * 100) + '%';
      // console.log(Math.floor((event.loaded / event.total) * 100));
    });

    switch (extension) {

// 3ds LOADER - - - - - - - -

      case '3ds':
        reader.addEventListener( 'load', async function ( event ) {
          var loader = new TDSLoader( manager );
          object = loader.parse( event.target.result );
          console.log("3DS")
          var tdsmat = new THREE.MeshPhongMaterial({ color: obj_fbx_3ds_texture });
           object.traverse( function ( child ) {
              if ( child.isMesh ) {
                var material = child.material;
                 if ( material.isMeshPhongMaterial ) {
                    if (material.map==null) {
                    }else{
                      child.material = tdsmat;
                    }
                 }
                 if ( material.isMeshLambertMaterial ) {
                    if (material.map==null) {
                    }else{
                      child.material = tdsmat;
                    }
                 }
                 if ( material.isMeshBasicMaterial ) {
                    if (material.map==null) {
                    }else{
                      child.material = tdsmat;
                    }
                 }
                }
                  lbox.expandByObject(child);
                if (lbox.min.x=-1000&&lbox.max.x>1000) {
                  child.scale.set(.1,.1,.1)
                }
                if (lbox.min.x=-5000&&lbox.max.x>5000) {
                  child.scale.set(.0001,.0001,.0001)
                }
              })
          window.FileViewerComponent.setupNewObject(object);
          window.FileViewerComponent.success(extension);

        }, false );
        reader.readAsArrayBuffer( file );
        break;

// GLB LOADER - - - - - - - -

      case 'glb':
        reader.addEventListener( 'load', async function ( event ) {
          var contents = event.target.result;
          var dracoLoader = new DRACOLoader( manager );
          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
          var loader = new GLTFLoader();
          loader.setDRACOLoader( dracoLoader );
          loader.parse( contents, '', function ( result ) {
            var scene = result.scene;
            scene.name = filename;
            window.FileViewerComponent.setupNewObject(scene);
            window.FileViewerComponent.success(extension);
                lbox.expandByObject(scene);
                if (lbox.min.x=-1000&&lbox.max.x>1000) {
                  scene.scale.set(.1,.1,.1)
                }
                if (lbox.min.x=-5000&&lbox.max.x>5000) {
                  scene.scale.set(.0001,.0001,.0001)
                }
          } );
        }, false );
        reader.readAsArrayBuffer( file );
        break;

// GLTF LOADER - - - - - - - -

      case 'gltf':
        reader.addEventListener(
          'load',
          function(event) {
            var contents = event.target.result;
            var loader;
            if (isGLTF1(contents)) {
              loader = new LegacyGLTFLoader(manager);
            } else {
              loader = new GLTFLoader(manager);
            }
            loader.parse(contents, '', function(result) {
              result.scene.name = filename;
              result.scene.traverse( function(child) {
                  child.castShadow = true;
                    lbox.expandByObject(child);
                    if (lbox.min.x=-1000&&lbox.max.x>1000) {
                      child.scale.set(.1,.1,.1)
                    }
                    if (lbox.min.x=-5000&&lbox.max.x>5000) {
                      child.scale.set(.0001,.0001,.0001)
                    }
                  })
              window.FileViewerComponent.setupNewObject(result.scene);
              window.FileViewerComponent.success(extension);
              }, 
              function ( error ) {
                window.FileViewerComponent.gltfbinerror();
            });
          }, false );
        reader.readAsArrayBuffer(file);
        break;

// AMF LOADER - - - - - - - -

      case 'amf':
        reader.addEventListener(
          'load',
          function(event) {
            var loader = new AMFLoader( manager );
            var amfobject = loader.parse(event.target.result);
            amfobject.traverse(function(child){
              lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
            })
            window.FileViewerComponent.setupNewObject(amfobject);
            window.FileViewerComponent.success(extension);
          }, false );
        reader.readAsArrayBuffer(file);
        break;

// DAE LOADER - - - - - - - -

      case 'dae':
        reader.addEventListener( 'load', async function ( event ) {
          var contents = event.target.result;
          var loader = new ColladaLoader( manager );
          var collada = loader.parse( contents );
          collada.scene.name = filename;
          var daemat = new THREE.MeshPhongMaterial({ color: dae_texture });
          collada.scene.traverse( function(child) {
              child.material = daemat;
              console.log("dae")
              child.castShadow = true;
              lbox.expandByObject(child);
                if (lbox.min.x=-1000&&lbox.max.x>1000) {
                  child.scale.set(.1,.1,.1)
                }
                if (lbox.min.x=-5000&&lbox.max.x>5000) {
                  child.scale.set(.0001,.0001,.0001)
              }
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
          })
          window.FileViewerComponent.setupNewObject(collada.scene);
          window.FileViewerComponent.success(extension);
        }, false );
        reader.readAsText( file );

        break;

// FBX LOADER - - - - - - - -

      case 'fbx':
        reader.addEventListener( 'load', async function ( event ) {
          var contents = event.target.result;
          var loader = new FBXLoader( manager );
          var object = loader.parse( contents );
           object.traverse( function ( child ) {
              lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
              if ( child.isMesh ) {
                var material = child.material;
              // IF FBX HAS TEXTURES BUT THEY'RE AN ARRAY OF MISSING PHONG TEXTURES 
                  if ( Array.isArray( material ) ) {
                    if ( material[0].isMeshPhongMaterial ) {
                        if (material[0].color.r==dm&&material[0].color.g==dm&&material[0].color.b==dm
                          ) {
                          if (textureissuec==0) {
                            window.FileViewerComponent.fbxtextureissue(extension);
                          }
                          child.material = new THREE.MeshPhongMaterial({color: 0x444444})
                          textureissuec=1;
                        }
                      }
              // IF FBX HAS TEXTURES BUT THEY'RE INDIVIDUAL MISSING PHONG TEXTURES 
                  } else if ( material.isMeshPhongMaterial ) {
                        if (material.color.r==dm&&material.color.g==dm&&material.color.b==dm) {
                          if (textureissuec==0) {
                            window.FileViewerComponent.fbxtextureissue(extension);
                          }
                          child.material = new THREE.MeshPhongMaterial({ color: 0x444444 })
                          textureissuec=1;
              // IF FBX HAS TEXTURES
                        }else{
                      }
                  }
              // IF FBX HAS TEXTURES BUT THEY'RE INDIVIDUAL MISSING TEXTURES 
                for( var i = 0; i < material.length; i++){
                  if ( material[ i ].isMeshLambertMaterial||material[ i ].isMeshBasicMaterial||material[ i ].isMeshPhongMaterial ) {
                    if (material[ i ].color.r==dm&&material[ i ].color.g==dm&&material[ i ].color.b==dm) {
                      if (textureissuec == 0) {
                            window.FileViewerComponent.fbxtextureissue(extension);
                          }
                          child.material = new THREE.MeshPhongMaterial({ color: 0x444444 })
                          textureissuec=1;
                        }
                      }
                    }
                  child.castShadow = true;
                }
              })
          window.FileViewerComponent.setupNewObject(object);
          window.FileViewerComponent.success(extension);
        }, false );
        reader.readAsArrayBuffer( file );

        break;      

// STL LOADER - - - - - - - -

      case 'stl':
        reader.addEventListener(
          'load',
          function(event) {
            var contents = event.target.result;
            var geometry = new STLLoader().parse(contents);
            geometry.sourceType = 'stl';
            geometry.sourceFile = file.name;
            var material = new THREE.MeshStandardMaterial();
            var mesh = new THREE.Mesh(geometry, material);
            mesh.traverse(function(child){
              lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
            })
            mesh.name = filename;
            window.FileViewerComponent.setupNewObject(mesh);
            window.FileViewerComponent.success(extension);
          }, false );
        if (reader.readAsBinaryString !== undefined) {
          reader.readAsBinaryString(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
        break;

// PLY LOADER - - - - - - - -

      case 'ply':
        reader.addEventListener(
          'load',
          function(event) {
            var contents = event.target.result;
            var geometry = new PLYLoader().parse(contents);
            geometry.sourceType = 'ply';
            geometry.sourceFile = file.name;
            var material = new THREE.MeshStandardMaterial();
            var mesh = new THREE.Mesh(geometry, material);
            mesh.traverse(function(child){
              lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
            })
            mesh.name = filename;
            window.FileViewerComponent.setupNewObject(mesh);
            window.FileViewerComponent.success(extension);
          }, false );
        reader.readAsArrayBuffer(file);
        break;

// SVG LOADER - - - - - - - -

      case 'svg':
            reader.addEventListener( 'load', async function ( event ) {
              var contents = event.target.result;
              var loader = new SVGLoader();
              var paths = loader.parse( contents ).paths;
              var group = new THREE.Group();
              group.scale.multiplyScalar( 0.1 );
              group.scale.y *= - 1;
              for ( var i = 0; i < paths.length; i ++ ) {
                var path = paths[ i ];
                var material = new THREE.MeshBasicMaterial( {
                  color: path.color,
                  depthWrite: false
                } );
                var shapes = SVGLoader.createShapes( path );
                for ( var j = 0; j < shapes.length; j ++ ) {
                  var shape = shapes[ j ];
                  var geometry = new THREE.ShapeGeometry( shape );
                  var mesh = new THREE.Mesh( geometry, material );
                  group.add( mesh );
                }
              }
              mesh.traverse(function(child){
                lbox.expandByObject(child);
                if (lbox.min.x=-1000&&lbox.max.x>1000) {
                  child.scale.set(.1,.1,.1)
                }
                if (lbox.min.x=-5000&&lbox.max.x>5000) {
                  child.scale.set(.0001,.0001,.0001)
                }
              })
              window.FileViewerComponent.setupNewObject(group);
              window.FileViewerComponent.success(extension);
            }, false);
          reader.readAsText( file );
          break;

// MD2 LOADER - - - - - - - -

      case 'md2':
        reader.addEventListener(
          'load',
          function(event) {
            var md2mat = new THREE.MeshPhongMaterial({ color: 0x222222 });
            var contents = event.target.result;
            var geometry = new MD2Loader().parse(contents);
            var material = new THREE.MeshStandardMaterial({
              morphTargets: true,
              morphNormals: true,
            });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.traverse(function(child){
              lbox.expandByObject(child);
              child.material = md2mat;
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
            })
            mesh.mixer = new THREE.AnimationMixer(mesh);
            mesh.name = filename;
            window.FileViewerComponent.setupNewObject(mesh);
            window.FileViewerComponent.success(extension);
          }, false );
        reader.readAsArrayBuffer(file);
        break;

// KMZ LOADER - - - - - - - -

      case 'kmz':
        reader.addEventListener( 'load', async function ( event ) {
          var loader = new KMZLoader();
          var collada = loader.parse( event.target.result );
          collada.scene.name = filename;
          collada.scene.traverse(function(child){
            lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
          })
          window.FileViewerComponent.setupNewObject(collada.scene);
          window.FileViewerComponent.success(extension);
        }, false );
        reader.readAsArrayBuffer( file );
        break;

// VTK LOADER - - - - - - - -

      case 'vtk':
        reader.addEventListener( 'load', async function ( event ) {
          var contents = event.target.result;
          var geometry = new VTKLoader().parse( contents );
          var material = new THREE.MeshStandardMaterial();
          var mesh = new THREE.Mesh( geometry, material );
          mesh.traverse(function(child){
            lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
          })
          mesh.name = filename;
          window.FileViewerComponent.setupNewObject(mesh);
          window.FileViewerComponent.success(extension);
        }, false );
        reader.readAsArrayBuffer( file );
        break;

// VOX LOADER - - - - - - - -

        case 'vox':
        reader.addEventListener( 'load', async function ( event ) {
        var contents = event.target.result;
          var chunks = new VOXLoader().parse( contents );
          const geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
          const material = new THREE.MeshNormalMaterial();
          const matrix = new THREE.Matrix4();
          for ( var i = 0; i < chunks.length; i ++ ) {
            const chunk = chunks[ i ];
            const size = chunk.size;
            const data = chunk.data;
            const mesh = new THREE.InstancedMesh( geometry, material, data.length / 4 );
            mesh.traverse(function(child){
            lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
            })
            mesh.scale.set( .2,.2,.2 );
            window.FileViewerComponent.setupNewObject(mesh);
            window.FileViewerComponent.success(extension);
            for ( var j = 0, k = 0; j < data.length; j += 4, k ++ ) {
              const x = data[ j + 0 ] - size.x / 2;
              const y = data[ j + 1 ] - size.y / 2;
              const z = data[ j + 2 ] - size.z / 2;
              mesh.setMatrixAt( k, matrix.setPosition( x, z, - y ) );
              }
            }
        },false );
        reader.readAsArrayBuffer( file );
        break;    

// DRACO LOADER - - - - - - - -

      case 'drc':
              reader.addEventListener( 'load', async function ( event ) {
                var contents = event.target.result;
                var loader = new DRACOLoader();
                loader.setDecoderPath( 'https://www.gstatic.com/draco/v1/decoders/' );
                loader.decodeDracoFile( contents, function ( geometry ) {
                  var object;
                  if ( geometry.index !== null ) {
                    var material = new THREE.MeshStandardMaterial();
                    object = new THREE.Mesh( geometry, material );
                    object.name = filename;
                  } else {
                    var material = new THREE.PointsMaterial( { size: 0.01 } );
                    if ( geometry.hasAttribute( 'color' ) === true ) material.vertexColors = true;
                    object = new THREE.Points( geometry, material );
                    object.traverse(function(child){
                      lbox.expandByObject(object);
                        if (lbox.min.x=-1000&&lbox.max.x>1000) {
                          object.scale.set(.1,.1,.1)
                        }
                        if (lbox.min.x=-5000&&lbox.max.x>5000) {
                          object.scale.set(.0001,.0001,.0001)
                        }
                    })
                    object.name = filename;
                  } window.FileViewerComponent.setupNewObject(object);
                  window.FileViewerComponent.success(extension);
                });
              }, false );
              reader.readAsArrayBuffer( file );
            break;

// WRL LOADER - - - - - - - -

      case 'wrl':
        reader.addEventListener( 'load', async function ( event ) {
          var contents = event.target.result;
          var result = new VRMLLoader().parse( contents );
            result.traverse(function(child){
            lbox.expandByObject(child);
              if (lbox.min.x=-1000&&lbox.max.x>1000) {
                child.scale.set(.1,.1,.1)
              }
              if (lbox.min.x=-5000&&lbox.max.x>5000) {
                child.scale.set(.0001,.0001,.0001)
              }
            })
          setTimeout(function(){
            window.FileViewerComponent.setupNewObject(result);
            window.FileViewerComponent.success(extension);
          },0)
        }, false );
        reader.readAsText( file );
        break;

// 3DM LOADER - - - - - - - -

        case '3dm':
              reader.addEventListener( 'load', async function ( event ) {
                var contents = event.target.result;
                var loader = new Rhino3dmLoader();
                loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' );
                loader.parse( contents, function ( object ) {
                object.traverse(function(child){
                  lbox.expandByObject(child);
                    if (lbox.min.x=-1000&&lbox.max.x>1000) {
                      child.scale.set(.1,.1,.1)
                    }
                    if (lbox.min.x=-5000&&lbox.max.x>5000) {
                      child.scale.set(.0001,.0001,.0001)
                    }
                  })
                  window.FileViewerComponent.setupNewObject(object);
                  window.FileViewerComponent.success(extension);
                } );
              }, false );
              reader.readAsArrayBuffer( file );
              break;


      // BEGINNING OF TEXTURE MESSAGES

      case 'jpg':
        if (jpgc==0) {
          window.FileViewerComponent.info(extension);
          jpgc = 1;
        }
      break;
      case 'png':
        if (pngc==0) {
          window.FileViewerComponent.info(extension);
          pngc = 1;
        }
      break;
      case 'dds':
        if (ddsc==0) {
          window.FileViewerComponent.info(extension);
          ddsc = 1;
        }
      break;

      // BEGINNING OF TEXTURE MESSAGES

      case 'bin':
        if (binc==0) {
          window.FileViewerComponent.bininfo(extension);
          binc = 1;
        }
      break;

      // END OF TEXTURE MESSAGES

      case 'txt':
        if (txtc==0) {
          window.FileViewerComponent.error(extension);
          txtc = 1;
        }
      break;
      case 'html':
        if (htmlc==0) {
          window.FileViewerComponent.error(extension);
          htmlc = 1;
        }
      break;
      case 'js':
        if (jsc==0) {
          window.FileViewerComponent.error(extension);
          jsc = 1;
        }
      break;
      case 'bvh':
        if (bvhc==0) {
          window.FileViewerComponent.error(extension);
          bvhc = 1;
        }
      break;
      case '3mf':
        if (tmfc==0) {
          window.FileViewerComponent.error(extension);
          tmfc = 1;
        }
      break;
      case 'assimp':
        if (assimpc==0) {
          window.FileViewerComponent.error(extension);
          assimpc = 1;
        }
      break;
      case 'gcode':
        if (gcodec==0) {
          window.FileViewerComponent.error(extension);
          gcodec = 1;
        }
      break;
      case 'mtl':
      break;
      case 'obj':
      break;

      default:

      if (nac==0) {
          window.FileViewerComponent.error(extension);
          nac = 1;
        }

      break;
    }

  };

  function handleJSON( data ) {
      if ( data.metadata === undefined ) { // 2.0
        data.metadata = { type: 'Geometry' };
      }
      if ( data.metadata.type === undefined ) { // 3.0
        data.metadata.type = 'Geometry';
      }
      if ( data.metadata.formatVersion !== undefined ) {
        data.metadata.version = data.metadata.formatVersion;
      }
      switch ( data.metadata.type.toLowerCase() ) {
        case 'buffergeometry':
          var loader = new THREE.BufferGeometryLoader();
          var result = loader.parse( data );
          var mesh = new THREE.Mesh( result );
          window.FileViewerComponent.setupNewObject(mesh);
          break;
        case 'geometry':
          console.error( 'Loader: "Geometry" is no longer supported.' );
          break;
        case 'object':
          var loader = new THREE.ObjectLoader();
          loader.setResourcePath( scope.texturePath );
          loader.parse( data, function ( result ) {
            if ( result.isScene ) {
              window.FileViewerComponent.setupNewObject(result);
            } else {
              window.FileViewerComponent.setupNewObject(result);
            }
          } );
          break;
        case 'app':
          window.FileViewerComponent.fromJSON( data );
          break;
      }
    }

  function createFileMap(files) {
    var map = {};
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      map[file.name] = file;
    }
    return map;
  }

  function handleZIP(contents) {
    var jsZip = new JSZip();

    var manager = new THREE.LoadingManager();
    manager.setURLModifier(function(url) {
      var file = zip.files[url];

      if (file) {
        console.log('Loading', url);

        var blob = new Blob([file.asArrayBuffer()], {
          type: 'application/octet-stream',
        });
        return URL.createObjectURL(blob);
      }

      return url;
    });

    var jsZip = new JSZip();

    jsZip.loadAsync(contents).then(function(zip) {
      console.log('zip: ', zip);
      zip.file('fox/fox.mtl').async('uint8array').then(function(fileData) {
          var mtlLoader = new MTLLoader();
          mtlLoader.setPath('');
          const materials = mtlLoader.parse(fileData);
          materials.preload();
          zip.file('fox/fox.obj').async('string').then(function(fileData) {
              var object = new OBJLoader()
                .setMaterials(materials)
                .parse(fileData);
              console.log('WE MADE IT FAM');
              window.FileViewerComponent.setupNewObject(object);
            });
        });
    });

  }

  function isGLTF1(contents) {
    var resultContent;
    if (typeof contents === 'string') {
      resultContent = contents;
    } else {
      var magic = THREE.LoaderUtils.decodeText(new Uint8Array(contents, 0, 4));
      if (magic === 'glTF') {
        var version = new DataView(contents).getUint32(4, true);
        return version < 2;
      } else {
        resultContent = THREE.LoaderUtils.decodeText(new Uint8Array(contents));
      }
    }
    var json = JSON.parse(resultContent);
    return json.asset != undefined && json.asset.version[0] < 2;
  }
};

function size_check(){
  const lbox = new THREE.Box3();
  lbox.expandByObject(object);
  if (lbox.min.x=-1000&&lbox.max.x>1000) {
    console.log("level 1 big")
    object.scale.set(.1,.1,.1)
    // window.FileViewerComponent.hugemodel_movecamera();
  }
  if (lbox.min.x=-5000&&lbox.max.x>5000) {
    console.log("level 2 big")
    object.scale.set(.0001,.0001,.0001)
    // window.FileViewerComponent.hugemodel_movecamera();
  }
}

var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
        var prog = Math.round(percentComplete, 2)

        window.FileViewerComponent.loadingprogress(prog);
    }
};

export default Loader;
