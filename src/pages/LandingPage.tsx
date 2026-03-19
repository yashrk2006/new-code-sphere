
import React, { useEffect, useState } from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    // CURSOR
    const cd = document.getElementById('cd');
    const cr = document.getElementById('cr');
    let rafId;
    if (cd && cr) {
      let mx = 0, my = 0, rx = 0, ry = 0;
      const onMove = (e) => { mx = e.clientX; my = e.clientY; };
      document.addEventListener('mousemove', onMove);
      const anim = () => {
        rx += (mx - rx) * 0.13;
        ry += (my - ry) * 0.13;
        cd.style.cssText = `left:${mx}px;top:${my}px`;
        cr.style.cssText = `left:${rx}px;top:${ry}px`;
        rafId = requestAnimationFrame(anim);
      };
      anim();
      
      const setHov = () => document.body.classList.add('hov');
      const rmHov = () => document.body.classList.remove('hov');
      const interactives = document.querySelectorAll('a, button, .ec, .sitem, .ento, .icard, .nrow');
      interactives.forEach(el => {
        el.addEventListener('mouseenter', setHov);
        el.addEventListener('mouseleave', rmHov);
      });

      return () => {
        document.removeEventListener('mousemove', onMove);
        cancelAnimationFrame(rafId);
        interactives.forEach(el => {
          el.removeEventListener('mouseenter', setHov);
          el.removeEventListener('mouseleave', rmHov);
        });
        rmHov();
      };
    }
  }, []);

  useEffect(() => {
    // THREE.JS BG
    const c = document.getElementById('bgc');
    if (!c || !window.THREE) return;
    
    const r = new window.THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: false });
    r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    r.setSize(window.innerWidth, window.innerHeight);
    
    const sc = new window.THREE.Scene();
    const cam = new window.THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    cam.position.z = 540;
    
    const N = 1600;
    const geo = new window.THREE.BufferGeometry();
    const p = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 1500;
      p[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      p[i * 3 + 2] = (Math.random() - 0.5) * 700;
      const t = Math.random();
      col[i * 3] = t * 0.05;
      col[i * 3 + 1] = t * 0.55 + 0.28;
      col[i * 3 + 2] = 0.95 + t * 0.05;
      sz[i] = Math.random() * 2 + 0.4;
    }
    
    geo.setAttribute('position', new window.THREE.BufferAttribute(p, 3));
    geo.setAttribute('color', new window.THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new window.THREE.BufferAttribute(sz, 1));
    
    const mat = new window.THREE.ShaderMaterial({
      uniforms: { t: { value: 0 } },
      vertexShader: `attribute float size;attribute vec3 color;varying vec3 vC;uniform float t;void main(){vC=color;vec3 q=position;q.y+=sin(t*0.24+q.x*0.006)*17.0;q.x+=cos(t*0.18+q.z*0.005)*11.0;vec4 mv=modelViewMatrix*vec4(q,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=size*(370.0/-mv.z);}`,
      fragmentShader: `varying vec3 vC;void main(){float d=length(gl_PointCoord-0.5);if(d>0.5)discard;float a=(1.0-d*2.0)*0.62;gl_FragColor=vec4(vC,a);}`,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: window.THREE.AdditiveBlending
    });
    
    const pts = new window.THREE.Points(geo, mat);
    sc.add(pts);
    
    const grid = new window.THREE.GridHelper(2000, 48, 0x001528, 0x000d1c);
    grid.position.y = -370;
    sc.add(grid);
    
    let mx = 0, my = 0, tt = 0;
    const onMove = e => { 
      mx = (e.clientX / window.innerWidth - 0.5) * 2; 
      my = (e.clientY / window.innerHeight - 0.5) * 2; 
    };
    document.addEventListener('mousemove', onMove);
    
    let rafId;
    const tick = () => {
      tt += 0.006;
      mat.uniforms.t.value = tt;
      pts.rotation.y = mx * 0.03;
      pts.rotation.x = my * 0.02 - 0.08;
      grid.rotation.y = tt * 0.02;
      r.render(sc, cam);
      rafId = requestAnimationFrame(tick);
    };
    tick();
    
    const onResize = () => {
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
      r.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    
    return () => {
      document.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      r.dispose();
      geo.dispose();
      mat.dispose();
    };
  }, []);

  useEffect(() => {
    // 3D CARD TILT
    const cards = document.querySelectorAll('[data-tilt]');
    const cleanups = [];
    cards.forEach(card => {
      const onMove = e => {
        const b = card.getBoundingClientRect();
        const x = ((e.clientX - b.left) / b.width - 0.5) * 2;
        const y = ((e.clientY - b.top) / b.height - 0.5) * 2;
        card.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 7}deg) translateZ(10px)`;
        card.style.setProperty('--px', `${(x + 1) / 2 * 100}%`);
        card.style.setProperty('--py', `${(y + 1) / 2 * 100}%`);
      };
      const onLeave = () => { card.style.transform = ''; };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    // SCROLL REVEAL
    const io = new IntersectionObserver(e => {
      e.forEach(x => {
        if (x.isIntersecting) {
          x.target.classList.add('in');
          io.unobserve(x.target);
        }
      });
    }, { threshold: 0.08 });
    
    document.querySelectorAll('.rv').forEach(el => io.observe(el));

    // SMOOTH SCROLL
    const smoothLinks = document.querySelectorAll('a[href^="#"]');
    const onLinkClick = (e) => {
      const t = document.querySelector(e.currentTarget.getAttribute('href'));
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    smoothLinks.forEach(a => a.addEventListener('click', onLinkClick));

    return () => {
      cleanups.forEach(c => c());
      io.disconnect();
      smoothLinks.forEach(a => a.removeEventListener('click', onLinkClick));
    };
  });

  return (
    <div className="landing-page">
      {/* React HTML content */}
      
<div id="cur"><div id="cd"></div><div id="cr"></div></div>
<canvas id="bgc"></canvas>

{/*  NAV  */}
<nav>
  <div className="nlogo">
    <div className="nhex"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <span>Vision<span className="ndot">.</span>AIoT</span>
  </div>
  <ul className="nlinks">
    <li><a href="#edge">Edge</a></li>
    <li><a href="#solutions">Models</a></li>
    <li><a href="#dash">Platform</a></li>
    <li><a href="#industries">Industries</a></li>
    <li><a href="#ent">Enterprise</a></li>
  </ul>
  <div className="nright">
    <button className="nbg" onClick={() => navigate("/login")}>Sign In</button>
    <button className="nbs" onClick={() => navigate("/citizen")}>Citizen Portal →</button>
    <button className="ham" id="ham" onClick={toggleMenu}><span></span><span></span><span></span></button>
  </div>
</nav>
<div className="mmenu" id="mm">
  <a href="#edge" onClick={toggleMenu}>Edge Capabilities</a>
  <a href="#solutions" onClick={toggleMenu}>Neural Models</a>
  <a href="#dash" onClick={toggleMenu}>Platform</a>
  <a href="#industries" onClick={toggleMenu}>Industries</a>
  <a href="#ent" onClick={toggleMenu}>Enterprise</a>
  <a href="#cta" onClick={toggleMenu} style={{color: 'var(--cyan)'}}>Get Access →</a>
</div>

{/*  HERO  */}
<section id="hero">
  <div className="hi">
    <div className="hbadge"><span className="ldot"></span>Live · YOLOv8 Edge · System Nominal · v4.2.1</div>
    <h1 className="hh1">
      <span className="l1">Real-Time</span>
      <span className="l2">Edge Vision</span>
      <span className="l3">Intelligence</span>
    </h1>
    <div className="hbot">
      <div>
        <p className="hdesc">The most advanced AI vision stack for <strong>Industrial 4.0</strong>. Deploy YOLOv8-powered anomaly detection directly on edge hardware — zero cloud latency, maximum data sovereignty, seamless integration with your OT infrastructure.</p>
        <div className="hctas">
          <button className="btp"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>Request Demo</button>
          <button className="bot">View Documentation</button>
        </div>
      </div>
      <div className="hsg">
        <div className="hst"><div className="hsv">30<span>ms</span></div><div className="hsl">Detection Latency</div></div>
        <div className="hst"><div className="hsv">99.2<span>%</span></div><div className="hsl">Accuracy Score</div></div>
        <div className="hst"><div className="hsv">−95<span>%</span></div><div className="hsl">Bandwidth Cost</div></div>
      </div>
    </div>
  </div>
  <div className="hscroll"><div className="htrack"></div><span className="hslbl">Scroll</span></div>
</section>

{/*  DISCLAIMER  */}
<section id="disc">
  <div className="dw rv">
    <div className="dico">
      <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <div>
      <div className="dh"><span className="dt">Platform Use Cases & Intended Applications</span><span className="db2">Disclaimer</span></div>
      <p className="dbody">Vision AIoT is designed exclusively for authorized industrial, commercial, and institutional deployments. All monitoring activities must comply with applicable local, regional, and national privacy laws. Video feeds are processed on-premise — no footage is stored or transmitted externally without explicit consent. The following represent validated, ethical, and legally compliant applications of this technology.</p>
      <div className="dtags">
        <span className="dtag">🏭 Manufacturing Safety</span>
        <span className="dtag">🦺 PPE Compliance</span>
        <span className="dtag">🏗️ Construction Sites</span>
        <span className="dtag">🚢 Port & Logistics Security</span>
        <span className="dtag">🏥 Hospital Facility Management</span>
        <span className="dtag">⚡ Energy Plant Surveillance</span>
        <span className="dtag">🚦 Traffic Infrastructure</span>
        <span className="dtag">🛒 Retail Loss Prevention</span>
        <span className="dtag">🏛️ Public Safety</span>
        <span className="dtag">🌿 Agricultural QC</span>
        <span className="dtag">✈️ Airport Perimeter</span>
        <span className="dtag">🔬 Clean Room Compliance</span>
        <span className="dtag">🏦 Banking & Finance Security</span>
        <span className="dtag">🎓 Campus Safety</span>
      </div>
    </div>
  </div>
</section>

{/*  EDGE  */}
<section id="edge" className="sec">
  <div className="si">
    <div className="shr">
      <div className="rv"><div className="stag">Edge Advantage</div><h2 className="sh2">Why <span className="ac">Edge?</span><br/>Why Now.</h2></div>
      <p className="ssub rv d1">Cloud AI is last decade. Edge inference delivers instant results where it matters most — on the factory floor, in real time, with zero data leaving your facility.</p>
    </div>
    <div className="egrid">
      <div className="ec rv" data-tilt>
        <div className="ecn"><span>01 / PERFORMANCE</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity=".3" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></div>
        <div className="eico"><svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
        <div className="ect">Hyper-Low Latency</div>
        <div className="ecb">Detections in under 30ms. Processing happens directly on the edge device — no round trips to the cloud, no skipped frames, no delayed safety alerts when milliseconds matter.</div>
        <div className="ecm"><span className="ecml">Inference Time</span><span className="ecmv">22ms</span></div>
      </div>
      <div className="ec rv d1" data-tilt>
        <div className="ecn"><span>02 / PRIVACY</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity=".3" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></div>
        <div className="eico"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
        <div className="ect">Ghost Mode Privacy</div>
        <div className="ecb">Zero external video streaming. Sensitive feeds never leave the premises — all inference runs locally. Your facility's data stays air-gapped, sovereign, and GDPR-compliant by design.</div>
        <div className="ecm"><span className="ecml">External Data Sent</span><span className="ecmv">0 KB</span></div>
      </div>
      <div className="ec rv d2" data-tilt>
        <div className="ecn"><span>03 / EFFICIENCY</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity=".3" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></div>
        <div className="eico"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
        <div className="ect">Eco Efficiency</div>
        <div className="ecb">Slash bandwidth and cloud costs by 95%. Only high-value alert snapshots and metadata are transmitted — no 24/7 high-resolution video uploads burning your infrastructure budget.</div>
        <div className="ecm"><span className="ecml">Bandwidth Reduction</span><span className="ecmv">−95%</span></div>
      </div>
    </div>
  </div>
</section>

{/*  SOLUTIONS  */}
<section id="solutions" className="sec" style={{paddingTop: '0'}}>
  <div className="si">
    <div className="shr">
      <div className="rv"><div className="stag">Neural Models</div><h2 className="sh2">Pre-trained<br/><span className="ac">Precision</span></h2></div>
      <p className="ssub rv d1">Purpose-built YOLOv8 models for the most critical industrial safety and security use cases. Optimized for NVIDIA Jetson and Hailo NPUs.</p>
    </div>
    <div className="slist">
      {/*  PPE  */}
      <div className="sitem rv">
        <div className="simc">
          <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=80&fit=crop" alt="PPE Detection"/>
          <div className="simo"></div>
          <div className="bbs" style={{top: '18%', left: '36%', width: '18%', height: '40%', borderColor: '#22d3ee', color: '#22d3ee'}}><span className="bbl" style={{background: '#22d3ee', color: '#000'}}>VEST: 99.8%</span><div className="sbar" style={{background: '#22d3ee'}}></div></div>
          <div className="bbs" style={{top: '12%', left: '38%', width: '13%', height: '14%', borderColor: '#f43f5e', color: '#f43f5e'}}><span className="bbl" style={{background: '#f43f5e', color: '#fff'}}>NO HELMET ⚠</span></div>
          <div className="flive" style={{position: 'absolute', bottom: '12px', left: '12px'}}><span className="ldot"></span>Live · Node-A1</div>
        </div>
        <div className="scc">
          <div className="snum">Model 01 / PPE Compliance</div>
          <div className="stit">PPE Guard AI</div>
          <div className="sdesc">Real-time auditing of personal protective equipment across your entire facility. Instantly flags non-compliant workers in hazardous zones, triggers automated reporting workflows, and maintains a complete compliance audit trail for OSHA and ISO 45001 requirements.</div>
          <div className="stags">
            <span className="stg" style={{borderColor: 'rgba(34,211,238,.22)', color: 'var(--cyan)'}}>Hard Hats</span>
            <span className="stg" style={{borderColor: 'rgba(34,211,238,.22)', color: 'var(--cyan)'}}>Hi-Vis Vests</span>
            <span className="stg" style={{borderColor: 'rgba(34,211,238,.22)', color: 'var(--cyan)'}}>Safety Boots</span>
            <span className="stg" style={{borderColor: 'rgba(34,211,238,.22)', color: 'var(--cyan)'}}>Eye Protection</span>
            <span className="stg" style={{borderColor: 'rgba(34,211,238,.22)', color: 'var(--cyan)'}}>Face Shields</span>
          </div>
          <div className="sacc"><div><div className="sal">Model Accuracy</div><div className="sab" style={{marginTop: '5px'}}><div className="sabf" style={{width: '97%', background: 'var(--cyan)'}}></div></div></div><span className="sav">97.4%</span></div>
        </div>
      </div>
      {/*  PERIMETER  */}
      <div className="sitem rev rv" style={{marginTop: '2px'}}>
        <div className="simc">
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&fit=crop" alt="Perimeter Security"/>
          <div className="simo"></div>
          <div className="bbs" style={{top: '26%', left: '14%', width: '24%', height: '52%', borderColor: '#8b5cf6', color: '#8b5cf6'}}><span className="bbl" style={{background: '#8b5cf6', color: '#fff'}}>INTRUDER: 97.4%</span><div className="sbar" style={{background: '#8b5cf6'}}></div></div>
          <div className="flive" style={{position: 'absolute', bottom: '12px', left: '12px'}}><span className="ldot" style={{background: 'var(--rose)', boxShadow: '0 0 7px var(--rose)'}}></span>Alert · Loading-Dock-B</div>
        </div>
        <div className="scc">
          <div className="snum">Model 02 / Perimeter Defense</div>
          <div className="stit">Ghost Perimeter</div>
          <div className="sdesc">Distinguish authorized personnel, vehicles, and environmental noise with surgical precision. Reduce false alarms by 85% compared to legacy motion sensors, while maintaining zero-miss detection of genuine intrusion events across complex industrial environments.</div>
          <div className="stags">
            <span className="stg" style={{borderColor: 'rgba(139,92,246,.22)', color: 'var(--purple)'}}>Person Detection</span>
            <span className="stg" style={{borderColor: 'rgba(139,92,246,.22)', color: 'var(--purple)'}}>Vehicle Tracking</span>
            <span className="stg" style={{borderColor: 'rgba(139,92,246,.22)', color: 'var(--purple)'}}>Loitering Alerts</span>
            <span className="stg" style={{borderColor: 'rgba(139,92,246,.22)', color: 'var(--purple)'}}>Zone Access</span>
          </div>
          <div className="sacc"><div><div className="sal">False Alarm Reduction</div><div className="sab" style={{marginTop: '5px'}}><div className="sabf" style={{width: '85%', background: 'var(--purple)'}}></div></div></div><span className="sav" style={{color: 'var(--purple)'}}>−85%</span></div>
        </div>
      </div>
      {/*  QUALITY  */}
      <div className="sitem rv" style={{marginTop: '2px'}}>
        <div className="simc">
          <img src="https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=900&q=80&fit=crop" alt="Quality Inspection"/>
          <div className="simo"></div>
          <div className="bbs" style={{top: '33%', left: '28%', width: '26%', height: '26%', borderColor: '#f59e0b', color: '#f59e0b'}}><span className="bbl" style={{background: '#f59e0b', color: '#000'}}>DEFECT: 94.1%</span></div>
          <div className="flive" style={{position: 'absolute', bottom: '12px', left: '12px'}}><span className="ldot"></span>Line-QC · Node-C3</div>
        </div>
        <div className="scc">
          <div className="snum">Model 03 / Quality Assurance</div>
          <div className="stit">Defect Vision AI</div>
          <div className="sdesc">Automated visual quality inspection at production-line speed. Detect surface defects, dimensional inconsistencies, assembly errors, and contamination in real time — replacing slow manual checks with consistent, fatigue-free AI precision operating 24/7.</div>
          <div className="stags">
            <span className="stg" style={{borderColor: 'rgba(245,158,11,.22)', color: 'var(--amber)'}}>Surface Defects</span>
            <span className="stg" style={{borderColor: 'rgba(245,158,11,.22)', color: 'var(--amber)'}}>Assembly Errors</span>
            <span className="stg" style={{borderColor: 'rgba(245,158,11,.22)', color: 'var(--amber)'}}>Contamination</span>
            <span className="stg" style={{borderColor: 'rgba(245,158,11,.22)', color: 'var(--amber)'}}>Dimensional QC</span>
          </div>
          <div className="sacc"><div><div className="sal">Defect Detection Rate</div><div className="sab" style={{marginTop: '5px'}}><div className="sabf" style={{width: '94%', background: 'var(--amber)'}}></div></div></div><span className="sav" style={{color: 'var(--amber)'}}>94.1%</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  PLATFORM FEATURES  */}
<section className="sec" style={{paddingTop: '0'}}>
  <div className="si">
    <div className="shr"><div className="rv"><div className="stag">Platform Features</div><h2 className="sh2">Everything<br/><span className="ac">Built In</span></h2></div></div>
    <div className="fgrid rv">
      <div className="fc"><div className="fci" style={{background: 'rgba(34,211,238,.07)', borderColor: 'rgba(34,211,238,.18)'}}><svg style={{stroke: 'var(--cyan)'}} viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div><div className="fct">ROI Geofencing</div><div className="fcb">Draw custom polygons in the browser UI to define machine danger zones, restricted areas, and monitoring regions with pixel-perfect accuracy. No coding required.</div></div>
      <div className="fc"><div className="fci" style={{background: 'rgba(59,130,246,.07)', borderColor: 'rgba(59,130,246,.18)'}}><svg style={{stroke: 'var(--blue)'}} viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></div><div className="fct">OTA Model Updates</div><div className="fcb">Push newly trained custom models to all edge nodes simultaneously with zero downtime. Hot-swap models without rebooting hardware or interrupting surveillance coverage.</div></div>
      <div className="fc"><div className="fci" style={{background: 'rgba(139,92,246,.07)', borderColor: 'rgba(139,92,246,.18)'}}><svg style={{stroke: 'var(--purple)'}} viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></div><div className="fct">Neural Webhooks</div><div className="fcb">Route detection alerts to Slack, Teams, PagerDuty, email, MQTT brokers, or custom REST endpoints. Alerts exactly where your team already works — no new tools required.</div></div>
      <div className="fc"><div className="fci" style={{background: 'rgba(34,197,94,.07)', borderColor: 'rgba(34,197,94,.18)'}}><svg style={{stroke: 'var(--green)'}} viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div><div className="fct">Multi-Node Dashboard</div><div className="fcb">Manage unlimited edge nodes from a single command center. Live feeds, alert streams, performance metrics, and health monitoring — all unified in one real-time interface.</div></div>
      <div className="fc"><div className="fci" style={{background: 'rgba(244,63,94,.07)', borderColor: 'rgba(244,63,94,.18)'}}><svg style={{stroke: 'var(--rose)'}} viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div><div className="fct">Custom Model Training</div><div className="fcb">Bring your own annotated datasets or use our managed labeling pipeline. Fine-tune pre-trained models on your specific equipment, environments, and violation types.</div></div>
      <div className="fc"><div className="fci" style={{background: 'rgba(245,158,11,.07)', borderColor: 'rgba(245,158,11,.18)'}}><svg style={{stroke: 'var(--amber)'}} viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div><div className="fct">Compliance Reporting</div><div className="fcb">Automated audit trails, violation summaries, and compliance reports exported as PDF or via API. Built-in OSHA, ISO 45001, and GDPR-friendly data handling out of the box.</div></div>
    </div>
  </div>
</section>

{/*  DASHBOARD  */}
<section id="dash" className="sec" style={{paddingTop: '0'}}>
  <div className="si">
    <div className="shr">
      <div className="rv"><div className="stag">Command Center</div><h2 className="sh2">Eyes on<br/><span className="ac">Everything</span></h2></div>
      <p className="ssub rv d1">One unified dashboard for every edge node. Monitor live feeds, triage alerts, and track performance across your entire facility in real time.</p>
    </div>
    <div className="dout rv">
      <div className="dbar">
        <div className="tls"><div className="tl tlr"></div><div className="tl tly"></div><div className="tl tlg"></div></div>
        <div className="dbt">Vision AIoT Command Center · v4.2.1</div>
        <div className="dbs"><div className="dbsd"></div>All Systems Nominal</div>
      </div>
      <div className="dbody">
        <div className="dside">
          <div style={{marginBottom: '22px'}}>
            <div className="dslbl">Active Nodes (4)</div>
            <div className="nrow act"><span className="nn">Factory-Floor-A1</span><div className="ndot ndon"></div></div>
            <div className="nrow"><span className="nn">Warehouse-North</span><div className="ndot ndon"></div></div>
            <div className="nrow"><span className="nn">Loading-Dock-B</span><div className="ndot ndalrt"></div></div>
            <div className="nrow" style={{opacity: '.38'}}><span className="nn">Storage-Zone-C</span><div className="ndot ndoff"></div></div>
          </div>
          <div>
            <div className="dslbl">Alert Stream</div>
            <div className="alist">
              <div className="alrt ar"><span>[14:22:07]</span> PPE Violation — Node-A1<br/>No helmet · Line-3</div>
              <div className="alrt aa"><span>[14:18:44]</span> Loitering — Loading-Dock-B<br/>Duration &gt; 180s</div>
              <div className="alrt ac"><span>[14:09:31]</span> Zone-3 Entry · Warehouse-N<br/>Vehicle authorized</div>
            </div>
          </div>
        </div>
        <div className="dmain">
          <div className="dmh">
            <div className="dmt">Node-A1 · Main Production Line</div>
            <div className="bdgs"><span className="bdg bdon">YOLOv8-S</span><span className="bdg">FPS: 28.4</span><span className="bdg">GPU: 41%</span><span className="bdg">Uptime: 99.8%</span></div>
          </div>
          <div className="feed">
            <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80&fit=crop" alt="Factory live feed"/>
            <div className="fscan"></div>
            <div className="flive"><span className="ldot"></span>Live Recording · 1080p · H.264</div>
          </div>
          <div className="mrow">
            <div className="mtile"><div className="mlbl">Detections / min</div><div className="mval" style={{color: 'var(--text)'}}>42.8</div></div>
            <div className="mtile"><div className="mlbl">Confidence Score</div><div className="mval" style={{color: 'var(--cyan)'}}>99.2%</div></div>
            <div className="mtile"><div className="mlbl">Inference Time</div><div className="mval" style={{color: 'var(--purple)'}}>22ms</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  INDUSTRIES  */}
<section id="industries" className="sec">
  <div className="si">
    <div className="shr">
      <div className="rv"><div className="stag">Industries</div><h2 className="sh2">Built for the<br/><span className="ac">Real World</span></h2></div>
      <p className="ssub rv d1">Deployed across the most demanding environments on earth. Vision AIoT adapts to your industry's unique safety requirements and compliance standards.</p>
    </div>
    <div className="igrid">
      <div className="icard rv">
        <img src="https://images.unsplash.com/photo-1565515636169-8d3f7bd5f3c5?w=600&q=80&fit=crop" alt="Manufacturing"/>
        <div className="iov"></div>
        <div className="itag" style={{borderColor: 'rgba(34,211,238,.3)', color: 'var(--cyan)'}}>Manufacturing</div>
        <div className="ico"><div className="iname">Factory Floors</div><div className="idesc">PPE compliance · Machine guarding · Ergonomic risk detection</div></div>
      </div>
      <div className="icard rv d1">
        <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&fit=crop" alt="Construction"/>
        <div className="iov"></div>
        <div className="itag" style={{borderColor: 'rgba(245,158,11,.3)', color: 'var(--amber)'}}>Construction</div>
        <div className="ico"><div className="iname">Construction Sites</div><div className="idesc">Fall risk · Equipment proximity · Zone access control</div></div>
      </div>
      <div className="icard rv d2">
        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&fit=crop" alt="Warehousing"/>
        <div className="iov"></div>
        <div className="itag" style={{borderColor: 'rgba(59,130,246,.3)', color: 'var(--blue)'}}>Logistics</div>
        <div className="ico"><div className="iname">Warehousing & Ports</div><div className="idesc">Forklift safety · Loading dock · Inventory flow monitoring</div></div>
      </div>
      <div className="icard rv d3">
        <img src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80&fit=crop" alt="Energy"/>
        <div className="iov"></div>
        <div className="itag" style={{borderColor: 'rgba(34,197,94,.3)', color: 'var(--green)'}}>Energy</div>
        <div className="ico"><div className="iname">Energy & Utilities</div><div className="idesc">Perimeter defense · Hazmat compliance · Spill detection</div></div>
      </div>
    </div>
  </div>
</section>

{/*  ENTERPRISE  */}
<section id="ent" className="sec" style={{paddingTop: '0'}}>
  <div className="si">
    <div className="shr"><div className="rv"><div className="stag">Enterprise Ready</div><h2 className="sh2">Industrial<br/><span className="ac">Scale</span></h2></div></div>
    <div className="entg rv">
      <div className="entl">
        <h3 className="entit">Hardware<br/>Agnostic.<br/><span style={{WebkitTextStroke: '1.5px rgba(34,211,238,.3)', color: 'transparent'}}>Stack Proven.</span></h3>
        <p className="endesc">From NVIDIA Jetson Nano to high-performance Hailo-8 accelerators — container-first, protocol-agnostic, and engineered to scale with your factory floor, not your server rack budget.</p>
        <ul className="chl">
          <li><div className="chk"><svg viewBox="0 0 24 24" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>Docker Containerized Operations</li>
          <li><div className="chk"><svg viewBox="0 0 24 24" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>End-to-End AES-256 Encrypted Streams</li>
          <li><div className="chk"><svg viewBox="0 0 24 24" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>Full REST / gRPC API Gateway</li>
          <li><div className="chk"><svg viewBox="0 0 24 24" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>OTA Model Updates — Zero Downtime</li>
          <li><div className="chk"><svg viewBox="0 0 24 24" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>SSO / SAML 2.0 Enterprise Auth</li>
          <li><div className="chk"><svg viewBox="0 0 24 24" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>On-premise & Air-gapped Deployments</li>
        </ul>
      </div>
      <div className="entr">
        <div className="ento"><div className="etp">Compute</div><div className="etn" style={{color: 'var(--cyan)'}}>Jetson</div></div>
        <div className="ento"><div className="etp">Accelerator</div><div className="etn" style={{color: 'var(--purple)'}}>Hailo-8</div></div>
        <div className="ento"><div className="etp">IoT Protocol</div><div className="etn" style={{color: 'var(--blue)'}}>MQTT</div></div>
        <div className="ento"><div className="etp">API Layer</div><div className="etn" style={{color: 'var(--text)'}}>REST</div></div>
        <div className="ento"><div className="etp">Containers</div><div className="etn" style={{color: 'var(--amber)'}}>Docker</div></div>
        <div className="ento"><div className="etp">Orchestration</div><div className="etn" style={{color: 'var(--green)'}}>K8s</div></div>
      </div>
    </div>
  </div>
</section>

{/*  CTA  */}
<section id="cta">
  <div className="ctai rv">
    <h2 className="ctah">Ready to see it <span style={{background: 'linear-gradient(90deg,var(--cyan),var(--blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>live?</span></h2>
    <p className="ctas">Get a personalized demo with your actual facility use case. Setup takes under 15 minutes on existing hardware.</p>
    <div className="ctabs">
      <button className="btp"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>Book a Demo</button>
      <button className="bot">Start Free Trial</button>
    </div>
  </div>
</section>

{/*  FOOTER  */}
<footer>
  <div className="ftop">
    <div className="fbrand">
      <div className="nlogo" style={{marginBottom: '0'}}><div className="nhex" style={{animation: 'none', width: '28px', height: '28px'}}><svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><span style={{fontSize: '14px', fontWeight: '800', letterSpacing: '-.02em'}}>Vision<span className="ndot">.</span>AIoT</span></div>
      <p>The most advanced edge AI vision platform for industrial safety, security, and quality assurance. Built for the real world.</p>
      <div className="fsoc">
        <a className="fsb" href="#"><svg viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a>
        <a className="fsb" href="#"><svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg></a>
        <a className="fsb" href="#"><svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg></a>
        <a className="fsb" href="#"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></a>
      </div>
    </div>
    <div className="fc2"><h4>Platform</h4><ul><li><a href="#">Features</a></li><li><a href="#">Neural Models</a></li><li><a href="#">Command Center</a></li><li><a href="#">Integrations</a></li><li><a href="#">Pricing</a></li></ul></div>
    <div className="fc2"><h4>Developers</h4><ul><li><a href="#">API Docs</a></li><li><a href="#">REST Reference</a></li><li><a href="#">gRPC Guide</a></li><li><a href="#">MQTT Setup</a></li><li><a href="#">GitHub</a></li></ul></div>
    <div className="fc2"><h4>Company</h4><ul><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Careers</a></li><li><a href="#">Contact</a></li><li><a href="#">Security</a></li></ul></div>
  </div>
  <div className="fbot">
    <span className="fcp">© 2024 Vision AIoT Technologies. All rights reserved.</span>
    <div className="fleg"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Cookie Policy</a></div>
  </div>
</footer>

    </div>
  );
}
