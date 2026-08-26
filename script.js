(function(){
    const canvas = document.getElementById('scene');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth/window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8.4);
  
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  
    // ---- the lattice knot: layered wireframe torus-knots, palette-shifted ----
    const knotGroup = new THREE.Group();
    scene.add(knotGroup);
  
    const layers = [
      { color:0x8ec9c2, radius:1.55, tube:0.46, p:2, q:3, scale:1.00, opacity:0.55 },
      { color:0xc9a8dc, radius:1.55, tube:0.46, p:2, q:3, scale:1.015, opacity:0.35 },
      { color:0xd9b57f, radius:1.55, tube:0.46, p:2, q:3, scale:0.985, opacity:0.30 },
    ];
  
    const meshes = [];
    layers.forEach((l, i) => {
      const geo = new THREE.TorusKnotGeometry(l.radius, l.tube, 220, 20, l.p, l.q);
      const mat = new THREE.MeshBasicMaterial({
        color:l.color, wireframe:true, transparent:true, opacity:l.opacity,
        blending:THREE.AdditiveBlending, depthWrite:false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(l.scale);
      mesh.userData.spin = 0.06 + i*0.015;
      knotGroup.add(mesh);
      meshes.push(mesh);
    });
  
    // inner glow core
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9, 2),
      new THREE.MeshBasicMaterial({ color:0xf4efe6, transparent:true, opacity:0.10, blending:THREE.AdditiveBlending, depthWrite:false })
    );
    knotGroup.add(core);
  
    // ---- drifting particle field (nebula dust) ----
    const particleCount = window.innerWidth < 700 ? 700 : 1600;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      [0.556,0.420,0.690], // amethyst
      [0.247,0.722,0.678], // teal
      [0.710,0.408,0.565], // rose
      [0.851,0.710,0.498], // champagne
    ];
    for (let i=0; i<particleCount; i++){
      const r = 6 + Math.random()*22;
      const theta = Math.random()*Math.PI*2;
      const phi = Math.acos((Math.random()*2)-1);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi) - 6;
      const c = palette[(Math.random()*palette.length)|0];
      colors[i*3]=c[0]; colors[i*3+1]=c[1]; colors[i*3+2]=c[2];
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({ size:0.045, vertexColors:true, transparent:true, opacity:0.75, blending:THREE.AdditiveBlending, depthWrite:false });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
  
    // ---- pointer parallax ----
    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    function onPointer(nx, ny){ targetX = nx; targetY = ny; }
    window.addEventListener('mousemove', (e) => {
      onPointer((e.clientX/window.innerWidth - 0.5)*2, (e.clientY/window.innerHeight - 0.5)*2);
    });
    window.addEventListener('touchmove', (e) => {
      if(!e.touches[0]) return;
      onPointer((e.touches[0].clientX/window.innerWidth - 0.5)*2, (e.touches[0].clientY/window.innerHeight - 0.5)*2);
    }, { passive:true });
  
    // scroll fade for the 3D scene as user descends
    let scrollFade = 1;
    window.addEventListener('scroll', () => {
      const t = Math.min(window.scrollY / (window.innerHeight*0.9), 1);
      scrollFade = 1 - t;
      canvas.style.opacity = Math.max(scrollFade, 0);
    }, { passive:true });
  
    function onResize(){
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);
  
    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
  
      if (!reduceMotion){
        curX += (targetX - curX) * 0.04;
        curY += (targetY - curY) * 0.04;
  
        meshes.forEach((m, i) => {
          m.rotation.x = t * m.userData.spin + curY*0.25;
          m.rotation.y = t * m.userData.spin * 0.8 + curX*0.35;
          m.rotation.z = t * m.userData.spin * 0.4;
        });
        core.scale.setScalar(1 + Math.sin(t*1.4)*0.06);
        knotGroup.rotation.y = curX * 0.15;
        knotGroup.rotation.x = curY * 0.1;
  
        particles.rotation.y = t * 0.015;
        particles.rotation.x = t * 0.006;
        camera.position.x = curX * 0.3;
        camera.position.y = -curY * 0.2;
        camera.lookAt(0,0,0);
      }
  
      renderer.render(scene, camera);
    }
    animate();
  })();