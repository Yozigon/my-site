import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const mount = document.querySelector("[data-sphinx-scene]");

if (mount) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const group = new THREE.Group();
  const clock = new THREE.Clock();
  const blocks = [];
  const palette = [0xf0b84f, 0xe8a84a, 0xd98f3a, 0x5d86c5, 0xffffff];

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  scene.add(group);

  const ambient = new THREE.HemisphereLight(0xffffff, 0x164233, 2.35);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(5, 8, 5);
  scene.add(sun);

  const fill = new THREE.PointLight(0xffd782, 18, 10);
  fill.position.set(-3, 2.4, 3.2);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 5.2),
    new THREE.ShadowMaterial({ color: 0x12372d, opacity: 0.22 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.04;
  scene.add(floor);

  const cube = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const materials = palette.map((color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.08,
    })
  );

  const targetPoints = createSphinxTargets();

  targetPoints.forEach((target, index) => {
    const mesh = new THREE.Mesh(cube, materials[target.material]);
    const start = createStartPosition(index, targetPoints.length);
    mesh.position.copy(start);
    mesh.rotation.set(start.y * 0.18, start.x * 0.15, start.z * 0.12);
    mesh.userData = {
      start,
      target: target.position,
      delay: (index % 24) * 0.035 + Math.floor(index / 24) * 0.025,
      spin: new THREE.Vector3(
        0.4 + (index % 4) * 0.14,
        0.7 + (index % 5) * 0.12,
        0.3 + (index % 3) * 0.16
      ),
    };
    group.add(mesh);
    blocks.push(mesh);
  });

  const resize = () => {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 2.25, width < 620 ? 9.8 : 8.2);
    camera.lookAt(0.25, 0.45, 0);
    camera.updateProjectionMatrix();
  };

  const render = () => {
    const elapsed = clock.getElapsedTime();

    blocks.forEach((mesh) => {
      const { start, target, delay, spin } = mesh.userData;
      const progress = easeOutCubic(clamp((elapsed - delay) / 3.2, 0, 1));
      const float = Math.sin(elapsed * 2.1 + delay * 9) * (1 - progress) * 0.34;

      mesh.position.lerpVectors(start, target, progress);
      mesh.position.y += float;
      mesh.rotation.x = (1 - progress) * (elapsed * spin.x + start.y * 0.12);
      mesh.rotation.y = (1 - progress) * (elapsed * spin.y + start.x * 0.12) + progress * 0.18;
      mesh.rotation.z = (1 - progress) * (elapsed * spin.z + start.z * 0.12);
      mesh.scale.setScalar(0.68 + progress * 0.32);
    });

    group.rotation.y = -0.42 + Math.sin(elapsed * 0.34) * 0.08;
    group.rotation.x = -0.08 + Math.sin(elapsed * 0.28) * 0.025;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  resize();
  window.addEventListener("resize", resize);
  render();
}

function createSphinxTargets() {
  const targets = [];
  const addBlock = (x, y, z, material = 0) => {
    targets.push({
      position: new THREE.Vector3(x, y, z),
      material,
    });
  };

  const addGrid = (xRange, yRange, zRange, material = 0) => {
    for (let x = xRange[0]; x <= xRange[1]; x += 1) {
      for (let y = yRange[0]; y <= yRange[1]; y += 1) {
        for (let z = zRange[0]; z <= zRange[1]; z += 1) {
          addBlock(x * 0.32, y * 0.32, z * 0.32, material);
        }
      }
    }
  };

  addGrid([-8, 5], [0, 2], [-2, 2], 0);
  addGrid([-9, 6], [-1, -1], [-1, 1], 1);
  addGrid([3, 8], [-2, -2], [-2, -1], 1);
  addGrid([3, 8], [-2, -2], [1, 2], 1);
  addGrid([-8, -4], [-2, -2], [-2, -1], 1);
  addGrid([-8, -4], [-2, -2], [1, 2], 1);
  addGrid([5, 7], [3, 6], [-1, 1], 0);
  addGrid([4, 8], [4, 5], [-2, 2], 1);
  addGrid([5, 7], [7, 8], [-1, 1], 1);
  addGrid([5, 7], [6, 6], [-2, 2], 3);
  addGrid([6, 6], [9, 10], [-1, 1], 1);
  addGrid([4, 8], [8, 8], [-1, 1], 1);
  addGrid([8, 9], [2, 3], [-1, 1], 1);
  addGrid([-10, -8], [2, 3], [0, 0], 1);
  addGrid([-12, -10], [3, 4], [0, 0], 1);

  addBlock(1.6, 1.92, -0.64, 4);
  addBlock(2.24, 1.92, -0.64, 4);
  addBlock(1.6, 1.92, 0.64, 4);
  addBlock(2.24, 1.92, 0.64, 4);

  return targets;
}

function createStartPosition(index, total) {
  const angle = index * 2.399963;
  const band = index / total;
  const radius = 8.6 + (index % 7) * 0.34;
  const side = index % 2 === 0 ? 1 : -1;

  return new THREE.Vector3(
    Math.cos(angle) * radius,
    1.2 + Math.sin(band * Math.PI * 4) * 2.4 + side * 1.2,
    Math.sin(angle) * radius
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}
