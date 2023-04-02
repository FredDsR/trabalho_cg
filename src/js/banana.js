"use strict";

// This is not a full .obj parser.
// see http://paulbourke.net/dataformats/obj/

async function main() {
  const {gl, twgl, meshProgramInfo} = initializeWorld('#banana-canvas')

  const {obj, materials} = await loadObjAndMat('../../src/models/banana/banana.obj');

  const textures = {
    defaultWhite: twgl.createTexture(gl, {src: [255, 255, 255, 255]}),
    defaultNormal: twgl.createTexture(gl, {src: [127, 127, 255, 0]}),
  };

  // load texture for materials
  for (const material of Object.values(materials)) {
    Object.entries(material)
      .filter(([key]) => key.endsWith('Map'))
      .forEach(([key, filename]) => {
        let texture = textures[filename];
        if (!texture) {
          const textureHref = new URL(filename, baseHref).href;
          texture = twgl.createTexture(gl, {src: textureHref, flipY: true});
          textures[filename] = texture;
        }
        material[key] = texture;
      });
  }

  // hack the materials so we can see the specular map
  Object.values(materials).forEach(m => {
    m.shininess = 25;
    m.specular = [3, 2, 1];
  });

  const defaultMaterial = {
    diffuse: [1, 1, 1],
    diffuseMap: textures.defaultWhite,
    normalMap: textures.defaultNormal,
    ambient: [0, 0, 0],
    specular: [1, 1, 1],
    specularMap: textures.defaultWhite,
    shininess: 400,
    opacity: 1,
  };

  const extents = getGeometriesExtents(obj.geometries);
  const range = m4.subtractVectors(extents.max, extents.min);
  // amount to move the object so its center is at the origin
  const objOffset = m4.scaleVector(
      m4.addVectors(
        extents.min,
        m4.scaleVector(range, 0.5)),
        -1);
        
        const cameraTarget = [0, 0, 0];
        // figure out how far away to move the camera so we can likely
        // see the object.
        const radius = m4.length(range) * 0.5;

  const cameraPosition = m4.addVectors(cameraTarget, [
    0,
    0,
    radius*3,
  ]);
  // Set zNear and zFar to something hopefully appropriate
  // for the size of this object.
  const zNear = radius / 100;
  const zFar = radius * 100;
  
  const defaultColor = [255, 255, 0, 1];
  // GUI
  const state = setControls('banana', defaultColor);
  let oldState = {...state};
  
  let parts = mapObjData(obj, state.color, defaultMaterial, materials, gl, twgl, meshProgramInfo);

  function render(time) {
    time *= 0.001;  // convert to seconds
    
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
  
    const up = [0, 1, 0];

    // Compute the camera's matrix using look at.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);    

    // Make a view matrix from the camera matrix.
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
    };

    gl.useProgram(meshProgramInfo.program);

    // calls gl.uniform
    twgl.setUniforms(meshProgramInfo, sharedUniforms);

    // compute the world matrix once since all parts
    // are at the same space.
    // let u_world = m4.yRotation(time);
    // u_world = m4.translate(u_world, ...objOffset);
    const objControl = m4.addVectors(objOffset, [(state.controlX / 10),
                                                 (state.controlY / 10),
                                                 (state.zoom / 15)]);

    let u_world = m4.translation(...objControl);
    u_world = m4.zRotate(u_world, degToRad(45));
    u_world = m4.xRotate(u_world, degToRad(state.rotationX))
    u_world = m4.yRotate(u_world, degToRad(state.rotationY))
    u_world = m4.zRotate(u_world, degToRad(state.rotationZ))

    if (oldState.color != state.color) {
      parts = mapObjData(obj, state.color, defaultMaterial, materials, gl, twgl, meshProgramInfo);
    }

    for (const {bufferInfo, vao, material} of parts) {
      // set the attributes for this part.
      gl.bindVertexArray(vao);
      // calls gl.uniform
      twgl.setUniforms(meshProgramInfo, {
        u_world,
      }, material);

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    oldState = {...state};
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
