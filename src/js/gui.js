const cameraState = {
  shouldAnimate: false,
  cameraTransitionDuration: 10
}

var config = { 
  rotate: degToRad(0),
  quantity: 1
};

const loadGUI = () => {
  const gui = new dat.GUI();
  gui.add(config, "rotate", 0, 20, 0.5);
  gui.add(config, "quantity", 1, 10, 1);

  gui.add(cameraState, "shouldAnimate");
  gui.add(cameraState, "cameraTransitionDuration", 0, 10, 1);
};
