function main() {
  const { gl, meshProgramInfo } = initializeWorld();
  
  var fieldOfViewRadians = degToRad(60);

  const cubeTranslation = [0, 0, 0];

  const cubeBufferInfo = flattenedPrimitives.createCubeBufferInfo(gl, 20);

  const cubeVAO = twgl.createVAOFromBufferInfo(
    gl,
    meshProgramInfo,
    cubeBufferInfo,
  );

  const cubeUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1],
    u_matrix: m4.identity(),
  };
  
  cubeDistance = 30;
  cubeMaxQuantityPerRow = 5;

  function computeMatrix(viewProjectionMatrix, translation, yRotation) {
    var matrix = m4.translate(
      viewProjectionMatrix,
      translation[0],
      translation[1],
      translation[2],
    );
    return m4.yRotate(matrix, yRotation);
  }

  loadGUI();
  
  let then = 0;
  let deltatime;
  let timeTracker = 0;

  cameraSpeed = 10;
  var cameraPosition = [0, 0, 100];

  function render(time) {
    time *= 0.001;
    deltatime = time - then;
    then = time;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.

    if (cameraState.shouldAnimate) {
      if (time - timeTracker > cameraState.cameraTransitionDuration) {
        cameraSpeed *= -1;
        timeTracker = time;
      }
      
      cameraPosition[0] += cameraSpeed * deltatime; 
    }
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    gl.useProgram(meshProgramInfo.program);

    
    // ------ Draw the cube --------
    gl.bindVertexArray(cubeVAO);
    
    let j = cubeDistance, k = 0;
    for (let i = 0; i < config.quantity; i++) {

      cubeTranslation[0] = (k * cubeDistance);
      cubeTranslation[1] = j;

      // Setup all the needed attributes.
      cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        config.rotate,
      );
  
      // Set the uniforms we just computed
      twgl.setUniforms(meshProgramInfo, cubeUniforms);
  
      twgl.drawBufferInfo(gl, cubeBufferInfo);
      
      k++;
      if (k == cubeMaxQuantityPerRow) {
        k = 0;
        j -= cubeDistance;
      }
    }

	requestAnimationFrame(render);
  }
     
  requestAnimationFrame(render);
}

main();
