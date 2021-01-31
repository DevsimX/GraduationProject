import { Component } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
declare var THREE: any;

@Component({
  selector: 'layout-passport',
  templateUrl: './passport.component.html',
  styleUrls: ['./passport.component.less'],
})
export class LayoutPassportComponent {

  ngOnInit() {
    this.three();
  }

  three(){
    var count = 0, mouseX = 0, windowHalfX=null, camera = null,scene=null,particles=null,renderer=null;
    var amountX=50, amountY=50, color=0x1890ff, top=20;
    function onDocumentMouseMove(event){
      mouseX = event.clientX - windowHalfX
    }
    function onDocumentTouchStart(event) {
      if (event.touches.length === 1) {
        mouseX = event.touches[0].pageX - windowHalfX
      }
    }
    function onDocumentTouchMove(event) {
      if (event.touches.length === 1) {
        event.preventDefault()
        mouseX = event.touches[0].pageX - windowHalfX
      }
    }
    function init(){
      const SEPARATION = 100
      const SCREEN_WIDTH = window.innerWidth
      const SCREEN_HEIGHT = window.innerHeight
      const container = document.createElement('div')
      windowHalfX = window.innerWidth / 2
      container.style.height = (SCREEN_HEIGHT - 350) + 'px';
      container.style.marginTop = '-100px';
      container.style.zIndex = '-20';
      document.getElementById('index').appendChild(container)

      camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000)
      camera.position.z = 1000

      scene = new THREE.Scene()

      const numParticles = amountX * amountY
      const positions = new Float32Array(numParticles * 3)
      const scales = new Float32Array(numParticles)
      // 初始化粒子位置和大小
      let i = 0
      let j = 0
      for (let ix = 0; ix < amountX; ix++) {
        for (let iy = 0; iy < amountY; iy++) {
          positions[i] = ix * SEPARATION - ((amountX * SEPARATION) / 2)
          positions[i + 1] = 0
          positions[i + 2] = iy * SEPARATION - ((amountY * SEPARATION) / 2)
          scales[j] = 3
          i += 3
          j++
        }
      }

      const geometry = new THREE.BufferGeometry()
      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.addAttribute('scale', new THREE.BufferAttribute(scales, 1))
      // 初始化粒子材质
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(color) }
        },
        vertexShader: `
          attribute float scale;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 2.0 );
            gl_PointSize = scale * ( 300.0 / - mvPosition.z );
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          void main() {
            if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
            gl_FragColor = vec4( color, 1.0 );
          }
        `
      })

      particles = new THREE.Points(geometry, material)
      scene.add(particles)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearAlpha(0)
      container.appendChild(renderer.domElement)

      window.addEventListener('resize', onWindowResize, { passive: false })
      document.addEventListener('mousemove', onDocumentMouseMove, { passive: false })
      document.addEventListener('touchstart', onDocumentTouchStart, { passive: false })
      document.addEventListener('touchmove', onDocumentTouchMove, { passive: false })
    }
    function render() {
      camera.position.x += (mouseX - camera.position.x) * 0.05
      camera.position.y = 400
      camera.lookAt(scene.position)
      const positions = particles.geometry.attributes.position.array
      const scales = particles.geometry.attributes.scale.array
      // 计算粒子位置及大小
      let i = 0
      let j = 0
      for (let ix = 0; ix < amountX; ix++) {
        for (let iy = 0; iy < amountY; iy++) {
          positions[i + 1] = (Math.sin((ix + count) * 0.3) * 100) + (Math.sin((iy + count) * 0.5) * 100)
          scales[j] = ((Math.sin((ix + count) * 0.3) + 1) * 8 + (Math.sin((iy + count) * 0.5) + 1) * 8) * 3
          i += 3
          j++
        }
      }
      // 重新渲染粒子
      particles.geometry.attributes.position.needsUpdate = true
      particles.geometry.attributes.scale.needsUpdate = true
      renderer.render(scene, camera)
      count += 0.1
    }
    function animate() {
      requestAnimationFrame(animate)
      render()
    }
    function onWindowResize(){
      windowHalfX = window.innerWidth / 2
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    init();
    animate();

  }

}
