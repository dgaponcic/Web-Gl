var gl;
var canvas;

var selectedFigure;

var enableRotation = false;
var axis = 0;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

let nbTexture = 1;

class Light {
  constructor(lightPosition, lightAmbient, lightDiffuse, lightSpecular) {
    this.lightPosition = lightPosition;
    this.lightAmbient = lightAmbient;
    this.lightDiffuse = lightDiffuse;
    this.lightSpecular = lightSpecular;
  }
}

const light1 = new Light(vec4(1, -10, 3, 0.0), vec4(0.2, 0.2, 0.2, 1.0), vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.5, 1.0, 1.0));
const light2 = new Light(vec4(-100, -10, 300, 0.0), vec4(0.2, 0.2, 0.2, 1.0), vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.5, 1.0, 1.0));
const light3 = new Light(vec4(-50, 10, 300, 0.0), vec4(0.2, 0.2, 0.2, 1.0), vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.5, 1.0, 1.0));

const lights = [light1, light2, light3];
let selectedLight = 0;

class Drawable {
  constructor(vertices, program, id, normals, textureCoords) {
    this.id = id;
    this.program = program;
    this.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW); // SET THE DATA, SPECIFY THE ARRAY, vertices in this cas

    this.nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW); // SET THE DATA, SPECIFY THE ARRAY, vertices in this cas


    this.tcBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tcBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);


    this.near = 0.5;
    this.far = 5.0;
    this.radius = 4.0;
    this.dr = 5.0 * Math.PI / 180.0;
    this.theta2 = 0.0;
    this.phi = 0.0;
    this.at = vec3(0.0, 0.0, 0.0);
    this.up = vec3(0.0, 1.0, 0.0);
    this.fovy = 45.0;
    this.aspect = canvas.width / canvas.height;

    this.vAttributeLocation = gl.getAttribLocation(program, 'vPosition');
    this.nAttributeLocation = gl.getAttribLocation(program, 'vNormal');
    this.tcAttributeLocation = gl.getAttribLocation(program, 'vTextureCoord');

    this.materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
    this.materialDiffuse = vec4(0, 0, 0.0, 1.0);
    this.materialSpecular = vec4(0.0, 1.0, 1.0, 1.0);
    this.materialShininess = 3.0;

    this.normals = normals;
    this.vertices = vertices;
    this.textureCoords = textureCoords;
    this.theta = [1300, 300, 200];
    this.thetaLoc = gl.getUniformLocation(this.program, "theta");
    this.coeff = 1;
    this.coeffLoc = gl.getUniformLocation(this.program, "coeff");
    this.trCoeff = [0, 0, 0];
    this.trCoeffLoc = gl.getUniformLocation(this.program, "trCoeff");
    this.modelView = gl.getUniformLocation(program, "modelView");
    this.projection = gl.getUniformLocation(program, "projection");

    // if (textureBinding.get(this.id) !== undefined) {
    this.textureDataLocation = gl.getUniformLocation(program, 'textureData');
    // } else {

    // }

    this.ambientProduct = mult(lights[0].lightAmbient, this.materialAmbient);

    this.specularProducts = [];
    this.diffuseProducts = [];

    for (i = 0; i < 3; i += 1) {
      this.diffuseProducts.push(mult(lights[i].lightDiffuse, this.materialDiffuse));
      this.specularProducts.push(mult(lights[i].lightSpecular, this.materialSpecular));
    }
    console.log(this.vertices);
    console.log(this.normals);
    console.log(this.textureCoords);
  }

  draw() {
    this.ambientProduct = mult(lights[0].lightAmbient, this.materialAmbient);

    this.specularProducts = [];
    this.diffuseProducts = [];

    for (i = 0; i < 3; i += 1) {
      this.diffuseProducts.push(mult(lights[i].lightDiffuse, this.materialDiffuse));
      this.specularProducts.push(mult(lights[i].lightSpecular, this.materialSpecular));
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
    gl.vertexAttribPointer(this.vAttributeLocation, 3, gl.FLOAT, false, 0, 0); // DESCRIBE THE DATA: EACH vertex has 3 values of type FLOAT
    gl.enableVertexAttribArray(this.vAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
    gl.vertexAttribPointer(this.nAttributeLocation, 4, gl.FLOAT, false, 0, 0); // DESCRIBE THE DATA: EACH vertex has 3 values of type FLOAT
    gl.enableVertexAttribArray(this.nAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.tcBuffer);
    gl.vertexAttribPointer(this.tcAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.tcAttributeLocation);


    if (textureBinding.get(this.id)) {
      gl.uniform1i(this.textureDataLocation, textureBinding.get(this.id));
    } else {
      gl.uniform1i(this.textureDataLocation, 0);
    }

    gl.uniform3fv(this.thetaLoc, this.theta);
    gl.uniform1f(this.coeffLoc, this.coeff);
    gl.uniform3fv(this.trCoeffLoc, this.trCoeff);

    gl.uniform4fv(gl.getUniformLocation(this.program,
      "ambientProduct"), flatten(this.ambientProduct));
    gl.uniform1f(gl.getUniformLocation(this.program,
      "shininess"), this.materialShininess);

    for (i = 0; i < 3; i += 1) {
      gl.uniform4fv(gl.getUniformLocation(this.program,
        `diffuseProduct${i}`), flatten(this.diffuseProducts[i]));
      gl.uniform4fv(gl.getUniformLocation(this.program,
        `specularProduct${i}`), flatten(this.specularProducts[i]));
      gl.uniform4fv(gl.getUniformLocation(this.program,
        `lightPosition${i}`), flatten(lights[i].lightPosition));
    }

    this.eye = vec3(this.radius * Math.sin(this.theta2) * Math.cos(this.phi),
      this.radius * Math.sin(this.theta2) * Math.sin(this.phi), this.radius * Math.cos(this.theta2));
    this.mvMatrix = lookAt(this.eye, this.at, this.up);
    this.pMatrix = perspective(this.fovy, this.aspect, this.near, this.far);

    gl.uniformMatrix4fv(this.modelView, false, flatten(this.mvMatrix));
    gl.uniformMatrix4fv(this.projection, false, flatten(this.pMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);
  }

}

const textureBinding = new Map();

var coord = {
  // For cube
  '1': vec3(0.1, 0.1, 0.1),
  '2': vec3(0.5, 0.1, 0.1),
  '3': vec3(0.5, 0.1, 0.5),
  '4': vec3(0.1, 0.1, 0.5),
  '5': vec3(0.1, 0.5, 0.1),
  '6': vec3(0.1, 0.5, 0.5),
  '7': vec3(0.5, 0.5, 0.5),
  '8': vec3(0.5, 0.5, 0.1),
  // For pyramid
  '9': vec3(-0.015, 0.215, -0.015),
  '10': vec3(-0.275, -0.275, 0.215),
  '11': vec3(0.215, -0.275, 0.215),
  '12': vec3(0.215, -0.275, -0.275),
  '13': vec3(-0.275, -0.275, -0.275),
}

verticesCube = [
  coord[4], coord[3], coord[2],
  coord[2], coord[1], coord[4],
  coord[1], coord[2], coord[5],
  coord[5], coord[2], coord[8],
  coord[2], coord[3], coord[8],
  coord[8], coord[3], coord[7],
  coord[7], coord[3], coord[4],
  coord[4], coord[6], coord[7],
  coord[6], coord[4], coord[1],
  coord[1], coord[5], coord[6],
  coord[8], coord[7], coord[6],
  coord[6], coord[5], coord[8],
]

verticesPyramid = [
  coord[9], coord[10], coord[11],
  coord[11], coord[9], coord[12],
  coord[12], coord[9], coord[13],
  coord[13], coord[9], coord[10],
  coord[10], coord[13], coord[12],
  coord[12], coord[11], coord[10],
]

textureCoordsCube = [
  vec3(1, 1), vec3(0, 1), vec3(0, 0),
  vec3(0, 0), vec3(1, 0), vec3(1, 1),
  vec3(1, 0), vec3(1, 1), vec3(0, 1),
  vec3(0, 1), vec3(0, 0), vec3(1, 0),
  vec3(1, 0), vec3(1, 1), vec3(0, 1),
  vec3(0, 1), vec3(0, 0), vec3(1, 0),
  vec3(1, 0), vec3(1, 1), vec3(0, 1),
  vec3(0, 1), vec3(0, 0), vec3(1, 0),
  vec3(1, 0), vec3(1, 1), vec3(0, 1),
  vec3(0, 1), vec3(0, 0), vec3(1, 0),
  vec3(1, 0), vec3(1, 1), vec3(0, 1),
  vec3(0, 1), vec3(0, 0), vec3(1, 0),
];

textureCoordsPyramid = [
  vec3(1, 1), vec3(0, 1), vec3(0, 0),
  vec3(0, 0), vec3(1, 0), vec3(1, 1),
  vec3(1, 0), vec3(1, 1), vec3(0, 1),
  vec3(0, 1), vec3(0, 0), vec3(1, 0),
  vec3(1, 0), vec3(1, 1), vec3(0, 1),
  vec3(0, 1), vec3(0, 0), vec3(1, 0),
];

let verticesFile;
let textureFile;
let normalsFile;
let indexFile;

function getRadians(angle) {
  return Math.PI * angle / 180;
}

function getCoordinates(angle) {
  return vec3(radius * Math.cos(getRadians(angle)) - 0.5, 0.5, radius * Math.sin(getRadians(angle)) - 0.1);
}

var radius = 0.3;
var angleDelta = 0.5;
var angle = 0;
var center = vec3(-0.5, 0.5, -0.1);
var topPyramid = vec3(-0.5, 1, -0.1);

verticesCone = [];
var ShapesCount = {
  cube: 0,
  cone: 0,
  pyramid: 0,
  fileShape: 0,
}

function calculateNormal(a, b, c) {
  // 3 main lines of NORMALS CALCULATION FOR 1 TRIANGLE WITH VERTICES a, b, c!
  var t1 = subtract(b, a);
  var t2 = subtract(c, a);
  var normal = normalize(cross(t2, t1));

  // converting vec3 to vec4, not needed if you send only vec3 to shaders, needed otherwise
  normal = vec4(normal);
  return normal;
}

normalsArray = [];
normalsArrayCube = [];
normalsArrayPyramid = [];

for (i = 0; i < verticesCube.length - 2; i += 3) {
  const normal = calculateNormal(verticesCube[i], verticesCube[i + 1], verticesCube[i + 2])
  normalsArrayCube.push(normal);
  normalsArrayCube.push(normal);
  normalsArrayCube.push(normal);
}

function getNormals(vertices) {
  const localNormals = [];
  for (i = 0; i < verticesPyramid.length - 2; i += 3) {
    const normal = calculateNormal(vertices[i], vertices[i + 1], vertices[i + 2])
    localNormals.push(normal);
    localNormals.push(normal);
    localNormals.push(normal);
  }
  return localNormals;
}

normalsArrayPyramid = getNormals(verticesPyramid);

textureCoordsCone = [];

while (angle < 360) {
  let point1 = getCoordinates(angle);
  angle += angleDelta;
  let point2 = getCoordinates(angle);

  verticesCone.push(point1);
  verticesCone.push(center);
  verticesCone.push(point2);
  textureCoordsCone.push(vec2(point1, center)); textureCoordsCone.push(vec2(center, point2)); textureCoordsCone.push(vec2(point1, point2));
  var normal = calculateNormal(point2, center, point1);

  normalsArray.push(normal);
  normalsArray.push(normal);
  normalsArray.push(normal);

  var normal = calculateNormal(point2, topPyramid, point1);

  verticesCone.push(point1);
  verticesCone.push(topPyramid);
  verticesCone.push(point2);
  textureCoordsCone.push(vec2(point1, center)); textureCoordsCone.push(vec2(center, point2)); textureCoordsCone.push(vec2(point1, point2));

  normalsArray.push(normal);
  normalsArray.push(normal);
  normalsArray.push(normal);
}

var to_draw = [];

function updateSelect() {
  var x = document.getElementById("mySelect");
  x.innerText = null
  for (element of to_draw) {
    var option = document.createElement("option");
    option.text = element.id;
    x.add(option);
  }
}

let finalFileVertices = [];
let finalFileNormals = [];
let finalFileTexture = [];

function addFigure(type, program) {
  ShapesCount[type] += 1;
  enableRotation = false;
  switch (type) {
    case "cube":
      var Cube = new Drawable(verticesCube, program, `cube${ShapesCount.cube}`, normalsArrayCube, textureCoordsCube);
      addToDraw(Cube);
      selectedFigure = Cube;
      break;
    case "cone":
      var Cone = new Drawable(verticesCone, program, `cone${ShapesCount.cone}`, normalsArray, textureCoordsCone);
      addToDraw(Cone);
      selectedFigure = Cone;
      break;
    case "pyramid":
      var Pyramid = new Drawable(verticesPyramid, program, `pyramid${ShapesCount.pyramid}`, normalsArrayPyramid, textureCoordsPyramid);
      addToDraw(Pyramid);
      selectedFigure = Pyramid;
      break;
    case "fileShape":
      var FileShape = new Drawable(finalFileVertices, program, `fileShape${ShapesCount.fileShape}`, finalFileNormals, finalFileTexture);
      addToDraw(FileShape);
      selectedFigure = FileShape;
      break;
  }
}

function addToDraw(shape) {
  to_draw.push(shape);
  updateSelect();
}

function deleteFigure() {
  const shape = selectedFigure;
  for (var i = 0; i < to_draw.length; i++) {
    if (to_draw[i] === shape) {
      to_draw.splice(i, 1);
    }
  }
  if (to_draw.length) {
    selectedFigure = to_draw[to_draw.length - 1];
  }
  updateSelect();
}

function updateSelectedShape() {
  selectedIndex = document.getElementById("mySelect").selectedIndex;
  selectedFigure = to_draw[selectedIndex];
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
    1.0]
    : null;
}

function normalizeDataFromFile(data) {
  const res = [];
  data.forEach((line) => {
    line.split(' ').slice(-3).forEach((element) => {
      res.push(parseFloat(element));
    });
  })
  return res;
}

function processFacesFromFile(faces, vertices, normals, texture) {
  const finalVertices = [];
  const finalNormals = [];
  const finalTexture = [];
  faces.forEach((face) => {
    face.trim().split(' ').slice(-3).forEach((element) => {
      const line = element.split('/').map((element) => parseInt(element) - 1);
      finalVertices.push(vec3(vertices[line[0] * 3], vertices[line[0] * 3 + 1], vertices[line[0] * 3 + 2]));
      finalNormals.push(vec4(normals[line[2] * 3], normals[line[2] * 3 + 1], normals[line[2] * 3 + 2], 1));
      finalTexture.push(vec2(texture[line[1] * 3], 1 - texture[line[1] * 3 + 1]));
    });
  });

  finalFileTexture = finalTexture;
  finalFileVertices = finalVertices;
  finalFileNormals = finalNormals;
}

function splitTextFromFile(text) {
  const lines = text.split(/\r?\n/).filter(line => line[0] === 'v' || line[0] === 'f');;
  let vertices = [];
  let normals = [];
  let texture = [];
  let faces = [];
  lines.forEach((line) => {
    if (line.startsWith('f')) {
      faces.push(line);
    }
    else if (line.startsWith('vn')) {
      normals.push(line);
    }
    else if (line.startsWith('vt')) {
      texture.push(line);
    }
    else if (line.startsWith('v')) {
      vertices.push(line);
    }
  })
  verticesFile = normalizeDataFromFile(vertices);
  normalsFile = normalizeDataFromFile(normals);
  textureFile = normalizeDataFromFile(texture)
  processFacesFromFile(faces, verticesFile, normalsFile, textureFile);
}


function readTextFromFile(file) {
  var reader = new FileReader(); // creating the object that will help us read the file
  // setting a listener that will catch the 'load' event of reader functions		
  reader.addEventListener('load', function (e) {
    // when the contents are loaded --- execute all of these actions
    var text = e.target.result;
    splitTextFromFile(text);
  });
  // listener for errors that may occur
  reader.addEventListener('error', function () {
    alert('File error happened!');
  });
  // the readAsText function will get the plain text from the file
  reader.readAsText(file); // when the function will complete execution, the 'load' event will fire
}

function setLoadTextureListener() {
  // setting listeners for both buttons, they will load different texture at different locations
  document.querySelectorAll('.texture').forEach(function (button) {
    button.addEventListener('change', function () {
      var selectedFiles = this.files;
      if (selectedFiles.length == 0) {
        alert('Error : No file selected');
        return;
      }
      var firstFile = selectedFiles[0];
      readImageFromFile(firstFile);
    });
  });
}

function readImageFromFile(file) {
  var reader = new FileReader();
  reader.addEventListener('load', function (e) {
    var imgRawData = e.target.result;
    var texture = loadTexture(gl, imgRawData);
  });

  reader.addEventListener('error', function () {
    alert('File error happened!');
  });

  reader.readAsDataURL(file);
}

function loadTexture(gl, dataRaw) {
  if (textureBinding.size !== 0) {
    textureBinding.set(selectedFigure.id, nbTexture);
    nbTexture += 1;
  } else {
    textureBinding.set(selectedFigure.id, nbTexture);
    nbTexture += 1;
  }
  console.log(textureBinding)
  // using the offsets like gl.TEXTURE+0 or gl.TEXTURE1+1 etc to load different textures in different memory locations
  gl.activeTexture(gl.TEXTURE0 + textureBinding.get(selectedFigure.id));
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, srcFormat, srcType, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  image.src = dataRaw;
  return texture;
}

function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.enable(gl.DEPTH_TEST);

  //
  //  Configure WebGL
  //
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.2, 0.7, 0.4);

  //  Load shaders and initialize attribute buffers

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  document.getElementById("addCube").onclick = function () {
    addFigure('cube', program);
  };
  document.getElementById("addCone").onclick = function () {
    addFigure('cone', program);
  };
  document.getElementById("addPyramid").onclick = function () {
    addFigure('pyramid', program);
  };

  document.getElementById("load").onclick = function () {
    addFigure('fileShape', program);
  }

  document.getElementById("deleteFigure").onclick = function () {
    deleteFigure();
    enableRotation = false;
  };


  document.getElementById("xButton").onclick = function () {
    axis = xAxis;
    enableRotation = true;
  };
  document.getElementById("yButton").onclick = function () {
    axis = yAxis;
    enableRotation = true;
  };
  document.getElementById("zButton").onclick = function () {
    axis = zAxis;
    enableRotation = true;
  };

  document.getElementById("stopButton").onclick = function () {
    enableRotation = false;
  };

  document.getElementById("LeftRight").oninput = function () {
    if (selectedFigure) selectedFigure.trCoeff[0] = this.value;
  }

  document.getElementById("UpDown").oninput = function () {
    if (selectedFigure) selectedFigure.trCoeff[1] = this.value;
  }

  document.getElementById("CloserFurther").oninput = function () {
    if (selectedFigure) selectedFigure.trCoeff[2] = this.value;
  }

  document.getElementById("Scale").oninput = function () {
    if (selectedFigure) selectedFigure.coeff = this.value;
  }

  document.getElementById("SelectedLight").onchange = function () {
    selectedLight = parseInt(this.value);
  }


  document.getElementById("IncreaseZ").onclick = function () {
    to_draw.forEach(shape => {
      shape.near *= 1.1;
      shape.far *= 1.1;
    })
  };

  document.getElementById("DecreaseZ").onclick = function () {
    to_draw.forEach(shape => {
      shape.near *= 0.9;
      shape.far *= 0.9;
    })
  };

  document.getElementById("IncreaseR").onclick = function () {
    to_draw.forEach(shape => {
      shape.radius *= 0.75;
    })
  };

  document.getElementById("DecreaseR").onclick = function () {
    to_draw.forEach(shape => {
      shape.radius /= 0.75;
    })
  };

  document.getElementById("thetaSlider").onchange = function () {
    to_draw.forEach(shape => {
      shape.theta2 = this.value * Math.PI / 180.0;
    })
  };
  document.getElementById("phiSlider").onchange = function () {
    to_draw.forEach(shape => {
      shape.phi = this.value * Math.PI / 180.0;
    })
  };
  document.getElementById("aspectSlider").onchange = function () {
    to_draw.forEach(shape => {
      shape.aspect = this.value;
    })
  };
  document.getElementById("fovSlider").onchange = function () {
    to_draw.forEach(shape => {
      shape.fovy = this.value;
    })
  };

  document.getElementById("atSliderX").onchange = function () {
    to_draw.forEach(shape => {
      shape.at[0] = this.value;
    })
  };

  document.getElementById("atSliderY").onchange = function () {
    to_draw.forEach(shape => {
      shape.at[1] = this.value;
    })
  };

  document.getElementById("atSliderZ").onchange = function () {
    to_draw.forEach(shape => {
      shape.at[2] = this.value;
    })
  };


  document.getElementById("lightX").onchange = function () { lights[selectedLight].lightPosition[0] = parseInt(this.value) };
  document.getElementById("lightY").onchange = function () { lights[selectedLight].lightPosition[1] = parseInt(this.value) };
  document.getElementById("lightZ").onchange = function () { lights[selectedLight].lightPosition[2] = parseInt(this.value) };

  document.getElementById("ambient").onchange = function () {
    for (i = 0; i < 3; i += 1) {
      lights[i].lightAmbient = hexToRgb(this.value);
    }
  }

  document.getElementById("specular").onchange = function () {
    lights[selectedLight].lightSpecular = hexToRgb(this.value);
  }

  document.getElementById("diffuse").onchange = function () {
    lights[selectedLight].lightDiffuse = hexToRgb(this.value);
  }



  document.getElementById("specularMaterial").onchange = function () {
    if (selectedFigure) selectedFigure.materialSpecular = hexToRgb(this.value);
  }

  document.getElementById("diffuseMaterial").onchange = function () {
    if (selectedFigure) selectedFigure.materialDiffuse = hexToRgb(this.value);
  }

  document.getElementById("ambientMaterial").onchange = function () {
    if (selectedFigure) selectedFigure.materialAmbient = hexToRgb(this.value);
  }

  document.getElementById("shininess").onchange = function () {
    if (selectedFigure) selectedFigure.materialShininess = this.value;
  }


  document.getElementById("file-input").addEventListener('change', function () {
    var selectedFiles = this.files;
    if (selectedFiles.length == 0) {
      alert('Error : No file selected');
      return;
    }
    var firstFile = selectedFiles[0]; // picking the first file from the selected ones
    readTextFromFile(firstFile);
  });

  setLoadTextureListener();

  render();
};

window.onload = init;

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (selectedFigure && enableRotation) {
    selectedFigure.theta[axis] += 1.5;
  }
  to_draw.forEach(drawable => {
    drawable.draw();
  });
  requestAnimFrame(render);
}