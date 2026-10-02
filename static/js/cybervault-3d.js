/**
 * CyberVault 3D Interactive Investigation Environment
 * Professional Escape Room Experience with Physical Mechanisms
 * Based on detailed design specifications for industrial cyber theme
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.155.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.155.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.155.0/examples/jsm/controls/OrbitControls.js';

class CyberVault3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.gameState = {
            powerRestored: false,
            circuitSolved: false,
            cipherUnlocked: false,
            laserGridDisabled: false,
            vaultOpened: false,
            keycards: { brass: false, blue: false, red: false }
        };
        this.interactableObjects = new Map();
        this.soundEffects = new Map();
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.createEnvironment();
        this.createCharacters();
        this.createInteractiveProps();
        this.setupEventListeners();
        this.setupAudio();
        this.animate();
        
        console.log('🏢 CyberVault 3D Environment Initialized');
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0d12, 0.04);
        this.scene.background = new THREE.Color(0x121417);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 2.5, 6);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }
}
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 15;
        this.controls.target.set(0, 1, 0);
    }
    
    setupLighting() {
        // Primary ambient lighting - warm Edison glow
        const ambientLight = new THREE.AmbientLight(0xffb066, 0.4);
        this.scene.add(ambientLight);
        
        // Blue accent spotlight
        const blueAccent = new THREE.SpotLight(0x00f0ff, 2, 12);
        blueAccent.position.set(-3, 4, -2);
        blueAccent.angle = Math.PI / 6;
        blueAccent.penumbra = 0.5;
        blueAccent.castShadow = true;
        this.scene.add(blueAccent);
        
        // Main overhead spotlight
        const mainLight = new THREE.SpotLight(0xffa500, 3, 15);
        mainLight.position.set(0, 6, 2);
        mainLight.angle = Math.PI / 4;
        mainLight.penumbra = 0.4;
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);
        
        // Workbench task light
        const taskLight = new THREE.PointLight(0xffaa44, 1.5, 5);
        taskLight.position.set(0, 2.5, -1);
        this.scene.add(taskLight);
        
        // Circuit breaker indicator lights
        this.createIndicatorLights();
    }
    
    createIndicatorLights() {
        const colors = [0xff0000, 0xffaa00, 0x00ff00]; // Red, Amber, Green
        const positions = [
            [-4, 2.5, -3],
            [-4, 2.2, -3],
            [-4, 1.9, -3]
        ];
        
        positions.forEach((pos, i) => {
            const light = new THREE.PointLight(colors[i], 0.5, 2);
            light.position.set(...pos);
            light.userData = { type: 'indicator', index: i, active: false };
            this.scene.add(light);
        });
    }
    
    createEnvironment() {
        this.createFloor();
        this.createWalls();
        this.createCeiling();
        this.createServerRacks();
        this.createPipework();
    }
    
    createFloor() {
        // Riveted metallic floor with subtle reflections
        const floorGeo = new THREE.PlaneGeometry(16, 12);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1f1813,
            roughness: 0.4,
            metalness: 0.6,
            envMapIntensity: 0.3
        });
        
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Floor detail strips
        this.createFloorDetails();
    }
    
    createFloorDetails() {
        for (let i = 0; i < 8; i++) {
            const stripGeo = new THREE.BoxGeometry(0.1, 0.02, 12);
            const stripMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.8,
                roughness: 0.3
            });
            
            const strip = new THREE.Mesh(stripGeo, stripMat);
            strip.position.set(-7 + i * 2, 0.01, 0);
            this.scene.add(strip);
        }
    }
    
    createWalls() {
        const wallHeight = 4;
        const wallPositions = [
            { pos: [0, wallHeight/2, -6], rot: [0, 0, 0], size: [16, wallHeight, 0.3] },
            { pos: [0, wallHeight/2, 6], rot: [0, 0, 0], size: [16, wallHeight, 0.3] },
            { pos: [-8, wallHeight/2, 0], rot: [0, Math.PI/2, 0], size: [12, wallHeight, 0.3] },
            { pos: [8, wallHeight/2, 0], rot: [0, Math.PI/2, 0], size: [12, wallHeight, 0.3] }
        ];
        
        wallPositions.forEach(wall => {
            const wallGeo = new THREE.BoxGeometry(...wall.size);
            const wallMat = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.set(...wall.pos);
            wallMesh.rotation.set(...wall.rot);
            wallMesh.receiveShadow = true;
            this.scene.add(wallMesh);
        });
        
        this.createWallDetails();
    }
    
    createWallDetails() {
        // Circuit conduits running along walls
        for (let i = 0; i < 6; i++) {
            const conduitGeo = new THREE.CylinderGeometry(0.05, 0.05, 14);
            const conduitMat = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.7,
                roughness: 0.4
            });
            
            const conduit = new THREE.Mesh(conduitGeo, conduitMat);
            conduit.position.set(-7 + i * 2.8, 1.5 + Math.sin(i) * 0.3, -5.8);
            conduit.rotation.z = Math.PI / 2;
            this.scene.add(conduit);
        }
    }
    
    createCeiling() {
        const ceilingGeo = new THREE.PlaneGeometry(16, 12);
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });
        
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 4;
        this.scene.add(ceiling);
        
        // Ceiling lights fixtures
        this.createCeilingFixtures();
    }
    
    createCeilingFixtures() {
        const positions = [
            [-2, 3.8, -2],
            [2, 3.8, -2],
            [0, 3.8, 2]
        ];
        
        positions.forEach(pos => {
            const fixtureGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
            const fixtureMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.6
            });
            
            const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
            fixture.position.set(...pos);
            this.scene.add(fixture);
            
            // Glowing panel
            const panelGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
            const panelMat = new THREE.MeshStandardMaterial({
                color: 0xffff88,
                emissive: 0xffff44,
                emissiveIntensity: 0.3
            });
            
            const panel = new THREE.Mesh(panelGeo, panelMat);
            panel.position.set(pos[0], pos[1] - 0.1, pos[2]);
            this.scene.add(panel);
        });
    }
    
    createServerRacks() {
        const rackPositions = [
            [6, 0, -4],
            [6, 0, -2],
            [6, 0, 0]
        ];
        
        rackPositions.forEach((pos, index) => {
            const rack = this.createServerRack();
            rack.position.set(...pos);
            rack.userData = { type: 'serverRack', index };
            this.scene.add(rack);
        });
    }
    
    createServerRack() {
        const rackGroup = new THREE.Group();
        
        // Main frame
        const frameGeo = new THREE.BoxGeometry(1.2, 2.5, 0.8);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.3
        });
        
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 1.25;
        frame.castShadow = true;
        rackGroup.add(frame);
        
        // Server units with LED indicators
        for (let i = 0; i < 6; i++) {
            const unitGeo = new THREE.BoxGeometry(1.0, 0.3, 0.6);
            const unitMat = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                metalness: 0.7
            });
            
            const unit = new THREE.Mesh(unitGeo, unitMat);
            unit.position.set(0, 0.4 + i * 0.35, 0.05);
            rackGroup.add(unit);
            
            // Status LED
            const ledGeo = new THREE.SphereGeometry(0.03);
            const ledMat = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.5 ? 0x00ff00 : 0xff0000,
                emissive: Math.random() > 0.5 ? 0x004400 : 0x440000,
                emissiveIntensity: 0.5
            });
            
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(0.4, 0.4 + i * 0.35, 0.35);
            rackGroup.add(led);
        }
        
        return rackGroup;
    }
    
    createPipework() {
        // Industrial pipe network along ceiling
        const pipePoints = [
            new THREE.Vector3(-6, 3.5, -4),
            new THREE.Vector3(-2, 3.5, -4),
            new THREE.Vector3(-2, 3.5, 0),
            new THREE.Vector3(4, 3.5, 0),
            new THREE.Vector3(4, 3.5, 3)
        ];
        
        for (let i = 0; i < pipePoints.length - 1; i++) {
            const start = pipePoints[i];
            const end = pipePoints[i + 1];
            const distance = start.distanceTo(end);
            
            const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, distance);
            const pipeMat = new THREE.MeshStandardMaterial({
                color: 0x6B4423,
                metalness: 0.6,
                roughness: 0.4
            });
            
            const pipe = new THREE.Mesh(pipeGeo, pipeMat);
            
            // Position and orient pipe between points
            const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            pipe.position.copy(midPoint);
            
            const direction = new THREE.Vector3().subVectors(end, start).normalize();
            pipe.lookAt(end);
            pipe.rotateX(Math.PI / 2);
            
            this.scene.add(pipe);
        }
    }
    
    createCharacters() {
        this.createVictim();
        this.createHolographicOperator();
    }
    
    createVictim() {
        // Deceased investigator slumped at workbench
        const victimGroup = new THREE.Group();
        
        // Body (capsule approximation)
        const bodyGeo = new THREE.CapsuleGeometry(0.35, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a, // Dark clothing
            roughness: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.8, 0);
        body.rotation.z = Math.PI / 6; // Slumped pose
        victimGroup.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.18);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xfdbcb4,
            roughness: 0.6
        });
        
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(-0.2, 1.3, 0.1);
        victimGroup.add(head);
        
        // Position at workbench
        victimGroup.position.set(0, 0.55, -0.8);
        victimGroup.userData = { 
            type: 'victim', 
            interactable: true,
            examined: false 
        };
        
        this.scene.add(victimGroup);
        this.interactableObjects.set('victim', victimGroup);
    }
    
    createHolographicOperator() {
        // Semi-transparent wireframe figure
        const operatorGeo = new THREE.BoxGeometry(0.4, 1.8, 0.3);
        const operatorMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.0 // Initially invisible
        });
        
        const operator = new THREE.Mesh(operatorGeo, operatorMat);
        operator.position.set(-3, 1, -3);
        operator.userData = { 
            type: 'hologram',
            visible: false,
            glitchTimer: 0
        };
        
        this.scene.add(operator);
        this.interactableObjects.set('hologram', operator);
    }
    
    createInteractiveProps() {
        this.createWorkbench();
        this.createCircuitBreakerBox();
        this.createCipherDesk();
        this.createPrismChamber();
        this.createVaultDoor();
        this.createLaserGrid();
    }
    
    createWorkbench() {
        const workbenchGroup = new THREE.Group();
        
        // Main desk structure - wood and metal hybrid
        const deskGeo = new THREE.BoxGeometry(2.5, 1.1, 1.4);
        const deskMat = new THREE.MeshStandardMaterial({
            color: 0x3d271d, // Dark wood
            roughness: 0.6,
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.castShadow = true;
        desk.receiveShadow = true;
        workbenchGroup.add(desk);
        
        // Metal edge trim
        const trimGeo = new THREE.BoxGeometry(2.6, 0.1, 1.5);
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.3
        });
        
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = 0.55;
        workbenchGroup.add(trim);
        
        // Circuit diagrams (flat panels on desk surface)
        this.createCircuitDiagrams(workbenchGroup);
        
        // Desk accessories
        this.createDeskAccessories(workbenchGroup);
        
        workbenchGroup.position.set(0, 0.55, -1);
        workbenchGroup.userData = { 
            type: 'workbench', 
            interactable: true 
        };
        
        this.scene.add(workbenchGroup);
        this.interactableObjects.set('workbench', workbenchGroup);
    }
    
    createCircuitDiagrams(parent) {
        // Circuit diagram papers scattered on desk
        for (let i = 0; i < 3; i++) {
            const paperGeo = new THREE.PlaneGeometry(0.4, 0.3);
            const paperMat = new THREE.MeshStandardMaterial({
                color: 0xf5f5dc,
                roughness: 0.8
            });
            
            const paper = new THREE.Mesh(paperGeo, paperMat);
            paper.rotation.x = -Math.PI / 2;
            paper.position.set(
                -0.8 + i * 0.5, 
                0.56, 
                -0.2 + Math.random() * 0.4
            );
            paper.rotation.z = Math.random() * 0.5;
            parent.add(paper);
        }
    }
    
    createDeskAccessories(parent) {
        // Brass gear mechanism (key item)
        const gearGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8);
        const gearMat = new THREE.MeshStandardMaterial({
            color: 0xB8860B,
            metalness: 0.9,
            roughness: 0.1
        });
        
        const gear = new THREE.Mesh(gearGeo, gearMat);
        gear.position.set(0.3, 0.57, 0.1);
        gear.userData = { type: 'brassGear', collectible: true };
        parent.add(gear);
        
        // Terminal screen
        const screenGeo = new THREE.BoxGeometry(0.5, 0.3, 0.05);
        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x001122,
            emissive: 0x002244,
            emissiveIntensity: 0.2
        });
        
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(-0.6, 0.7, 0);
        screen.rotation.x = -0.3;
        parent.add(screen);
    }
    
    createCircuitBreakerBox() {
        const breakerGroup = new THREE.Group();
        
        // Main breaker box housing
        const boxGeo = new THREE.BoxGeometry(1.2, 1.8, 0.3);
        const boxMat = new THREE.MeshStandardMaterial({
            color: 0x2F4F4F,
            metalness: 0.8,
            roughness: 0.4
        });
        
        const box = new THREE.Mesh(boxGeo, boxMat);
        breakerGroup.add(box);
        
        // Voltage meters
        this.createVoltageMeters(breakerGroup);
        
        // Toggle switches
        this.createToggleSwitches(breakerGroup);
        
        // Warning labels
        this.createWarningLabels(breakerGroup);
        
        breakerGroup.position.set(-4.5, 2, -3);
        breakerGroup.userData = { 
            type: 'circuitBreaker', 
            interactable: true,
            switchStates: [false, false, false, false],
            correctSequence: [true, false, true, true] // Solution pattern
        };
        
        this.scene.add(breakerGroup);
        this.interactableObjects.set('circuitBreaker', breakerGroup);
    }
    
    createVoltageMeters(parent) {
        const meterPositions = [
            [-0.3, 0.4, 0.16],
            [0.3, 0.4, 0.16]
        ];
        
        meterPositions.forEach((pos, index) => {
            // Meter housing
            const meterGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05);
            const meterMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                metalness: 0.7
            });
            
            const meter = new THREE.Mesh(meterGeo, meterMat);
            meter.position.set(...pos);
            meter.rotation.x = Math.PI / 2;
            parent.add(meter);
            
            // Needle
            const needleGeo = new THREE.BoxGeometry(0.15, 0.01, 0.002);
            const needleMat = new THREE.MeshStandardMaterial({
                color: 0xff0000
            });
            
            const needle = new THREE.Mesh(needleGeo, needleMat);
            needle.position.set(pos[0], pos[1], pos[2] + 0.03);
            needle.rotation.z = -Math.PI / 4 + Math.random() * Math.PI / 2;
            needle.userData = { type: 'meterNeedle', meterIndex: index };
            parent.add(needle);
        });
    }
    
    createToggleSwitches(parent) {
        const switchPositions = [
            [-0.4, -0.2, 0.16],
            [-0.13, -0.2, 0.16],
            [0.13, -0.2, 0.16],
            [0.4, -0.2, 0.16]
        ];
        
        switchPositions.forEach((pos, index) => {
            // Switch base
            const baseGeo = new THREE.BoxGeometry(0.08, 0.15, 0.06);
            const baseMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.6
            });
            
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.set(...pos);
            parent.add(base);
            
            // Switch lever
            const leverGeo = new THREE.BoxGeometry(0.03, 0.08, 0.01);
            const leverMat = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.8
            });
            
            const lever = new THREE.Mesh(leverGeo, leverMat);
            lever.position.set(pos[0], pos[1], pos[2] + 0.04);
            lever.userData = { 
                type: 'switch', 
                index: index,
                state: false,
                clickable: true
            };
            parent.add(lever);
        });
    }
    
    createWarningLabels(parent) {
        const labelGeo = new THREE.PlaneGeometry(0.3, 0.1);
        const labelMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(0, -0.7, 0.16);
        parent.add(label);
    }
    
    createCipherDesk() {
        const cipherGroup = new THREE.Group();
        
        // Cipher desk base
        const deskGeo = new THREE.BoxGeometry(1.5, 0.8, 1.0);
        const deskMat = new THREE.MeshStandardMaterial({
            color: 0x4a3728, // Dark wood
            roughness: 0.7
        });
        
        const desk = new THREE.Mesh(deskGeo, deskMat);
        cipherGroup.add(desk);
        
        // Brass rotating cipher wheels
        this.createCipherWheels(cipherGroup);
        
        // Cryptogram notebook
        this.createCryptogramNotebook(cipherGroup);
        
        cipherGroup.position.set(-2.5, 0.4, 1.5);
        cipherGroup.userData = { 
            type: 'cipherDesk', 
            interactable: true,
            wheelPositions: [0, 0, 0], // Current rotations
            correctSequence: [2, 1, 3] // Solution (geometric symbols)
        };
        
        this.scene.add(cipherGroup);
        this.interactableObjects.set('cipherDesk', cipherGroup);
    }
    
    createCipherWheels(parent) {
        const wheelPositions = [
            [-0.3, 0.5, 0.2],
            [0, 0.5, 0.2],
            [0.3, 0.5, 0.2]
        ];
        
        wheelPositions.forEach((pos, index) => {
            // Wheel base
            const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.03);
            const wheelMat = new THREE.MeshStandardMaterial({
                color: 0xB8860B, // Brass
                metalness: 0.9,
                roughness: 0.1
            });
            
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(...pos);
            wheel.userData = { 
                type: 'cipherWheel', 
                index: index,
                rotation: 0,
                clickable: true
            };
            parent.add(wheel);
            
            // Symbol markings (simplified as small boxes)
            for (let i = 0; i < 4; i++) {
                const markGeo = new THREE.BoxGeometry(0.02, 0.02, 0.01);
                const markMat = new THREE.MeshStandardMaterial({
                    color: 0x333333
                });
                
                const mark = new THREE.Mesh(markGeo, markMat);
                const angle = (i / 4) * Math.PI * 2;
                mark.position.set(
                    pos[0] + Math.cos(angle) * 0.08,
                    pos[1] + 0.02,
                    pos[2] + Math.sin(angle) * 0.08
                );
                parent.add(mark);
            }
        });
    }
    
    createCryptogramNotebook(parent) {
        const bookGeo = new THREE.BoxGeometry(0.3, 0.02, 0.4);
        const bookMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });
        
        const book = new THREE.Mesh(bookGeo, bookMat);
        book.position.set(0.5, 0.42, -0.2);
        book.rotation.y = Math.PI / 6;
        book.userData = { 
            type: 'notebook', 
            interactable: true,
            examined: false 
        };
        parent.add(book);
    }
    
    createPrismChamber() {
        const prismGroup = new THREE.Group();
        
        // Glass containment chamber
        const chamberGeo = new THREE.BoxGeometry(2, 2, 1);
        const chamberMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            transmission: 0.9,
            roughness: 0
        });
        
        const chamber = new THREE.Mesh(chamberGeo, chamberMat);
        chamber.position.y = 1;
        prismGroup.add(chamber);
        
        // Laser emitters
        this.createLaserEmitters(prismGroup);
        
        // Adjustable mirrors
        this.createAdjustableMirrors(prismGroup);
        
        // Target receivers
        this.createLaserTargets(prismGroup);
        
        prismGroup.position.set(3, 0, 3);
        prismGroup.userData = { 
            type: 'prismChamber', 
            interactable: true,
            mirrorAngles: [0, 0, 0],
            targetsHit: [false, false, false]
        };
        
        this.scene.add(prismGroup);
        this.interactableObjects.set('prismChamber', prismGroup);
    }
    
    createLaserEmitters(parent) {
        const emitterPositions = [
            [-0.8, 1, -0.4],
            [0.8, 1, -0.4],
            [0, 1.8, 0]
        ];
        
        emitterPositions.forEach((pos, index) => {
            const emitterGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
            const emitterMat = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0x440000,
                emissiveIntensity: 0.3
            });
            
            const emitter = new THREE.Mesh(emitterGeo, emitterMat);
            emitter.position.set(...pos);
            
            if (index < 2) {
                emitter.rotation.z = Math.PI / 2;
            }
            
            parent.add(emitter);
        });
    }
    
    createAdjustableMirrors(parent) {
        const mirrorPositions = [
            [-0.3, 1, 0],
            [0.3, 1, 0],
            [0, 1.3, 0.3]
        ];
        
        mirrorPositions.forEach((pos, index) => {
            // Mirror mount
            const mountGeo = new THREE.SphereGeometry(0.06);
            const mountMat = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.8
            });
            
            const mount = new THREE.Mesh(mountGeo, mountMat);
            mount.position.set(...pos);
            parent.add(mount);
            
            // Mirror surface
            const mirrorGeo = new THREE.CircleGeometry(0.08);
            const mirrorMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 1,
                roughness: 0
            });
            
            const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
            mirror.position.set(...pos);
            mirror.position.z += 0.02;
            mirror.userData = { 
                type: 'mirror', 
                index: index,
                angle: 0,
                clickable: true
            };
            parent.add(mirror);
        });
    }
    
    createLaserTargets(parent) {
        const targetPositions = [
            [0.9, 0.7, 0.48],
            [-0.9, 0.7, 0.48],
            [0, 0.3, 0.48]
        ];
        
        targetPositions.forEach((pos, index) => {
            const targetGeo = new THREE.CircleGeometry(0.05);
            const targetMat = new THREE.MeshStandardMaterial({
                color: 0x444444
            });
            
            const target = new THREE.Mesh(targetGeo, targetMat);
            target.position.set(...pos);
            target.userData = { 
                type: 'laserTarget', 
                index: index,
                hit: false 
            };
            parent.add(target);
        });
    }
    
    createVaultDoor() {
        const vaultGroup = new THREE.Group();
        
        // Massive vault door
        const doorGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x2F4F4F,
            metalness: 0.9,
            roughness: 0.3
        });
        
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.rotation.z = Math.PI / 2;
        door.position.x = 0.15;
        vaultGroup.add(door);
        
        // Wheel mechanism
        this.createVaultWheel(vaultGroup);
        
        // Keycard slots
        this.createKeycardSlots(vaultGroup);
        
        // Status lights
        this.createVaultStatusLights(vaultGroup);
        
        vaultGroup.position.set(7.5, 1.5, 0);
        vaultGroup.rotation.y = -Math.PI / 2;
        vaultGroup.userData = { 
            type: 'vaultDoor', 
            interactable: true,
            keycardSlots: [false, false, false], // Brass, Blue, Red
            wheelTurned: false,
            opened: false
        };
        
        this.scene.add(vaultGroup);
        this.interactableObjects.set('vaultDoor', vaultGroup);
    }
    
    createVaultWheel(parent) {
        // Central locking wheel
        const wheelGeo = new THREE.TorusGeometry(0.4, 0.08, 8, 16);
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0xB8860B,
            metalness: 0.9,
            roughness: 0.1
        });
        
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(0.16, 0, 0);
        wheel.userData = { 
            type: 'vaultWheel', 
            clickable: true,
            rotation: 0 
        };
        parent.add(wheel);
        
        // Spokes
        for (let i = 0; i < 6; i++) {
            const spokeGeo = new THREE.BoxGeometry(0.6, 0.04, 0.02);
            const spokeMat = new THREE.MeshStandardMaterial({
                color: 0xB8860B,
                metalness: 0.9
            });
            
            const spoke = new THREE.Mesh(spokeGeo, spokeMat);
            spoke.position.set(0.16, 0, 0);
            spoke.rotation.z = (i / 6) * Math.PI * 2;
            parent.add(spoke);
        }
    }
    
    createKeycardSlots(parent) {
        const slotPositions = [
            [0.16, 0.8, 0],
            [0.16, -0.8, 0],
            [0.16, 0, 0.8]
        ];
        
        const slotColors = [0xB8860B, 0x0066cc, 0xcc0000]; // Brass, Blue, Red
        
        slotPositions.forEach((pos, index) => {
            const slotGeo = new THREE.BoxGeometry(0.02, 0.2, 0.1);
            const slotMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a
            });
            
            const slot = new THREE.Mesh(slotGeo, slotMat);
            slot.position.set(...pos);
            parent.add(slot);
            
            // Indicator light
            const lightGeo = new THREE.SphereGeometry(0.03);
            const lightMat = new THREE.MeshStandardMaterial({
                color: slotColors[index],
                emissive: slotColors[index],
                emissiveIntensity: 0
            });
            
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.set(pos[0], pos[1], pos[2] - 0.15);
            light.userData = { 
                type: 'keycardLight', 
                index: index,
                active: false 
            };
            parent.add(light);
        });
    }
    
    createVaultStatusLights(parent) {
        const statusPositions = [
            [0.16, 0.4, -0.4],
            [0.16, -0.4, -0.4]
        ];
        
        statusPositions.forEach((pos, index) => {
            const lightGeo = new THREE.SphereGeometry(0.05);
            const lightMat = new THREE.MeshStandardMaterial({
                color: index === 0 ? 0xff0000 : 0x00ff00,
                emissive: index === 0 ? 0x440000 : 0x004400,
                emissiveIntensity: index === 0 ? 0.5 : 0
            });
            
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.set(...pos);
            light.userData = { 
                type: 'statusLight', 
                status: index === 0 ? 'locked' : 'ready',
                active: index === 0 
            };
            parent.add(light);
        });
    }
    
    createLaserGrid() {
        const laserGroup = new THREE.Group();
        
        // Laser emitter posts
        const postPositions = [
            [-1, 0, 4],
            [1, 0, 4]
        ];
        
        postPositions.forEach(pos => {
            const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5);
            const postMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.8
            });
            
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(pos[0], 1.25, pos[2]);
            laserGroup.add(post);
        });
        
        // Laser beams (initially active)
        this.createLaserBeams(laserGroup);
        
        laserGroup.userData = { 
            type: 'laserGrid', 
            active: true,
            disabled: false 
        };
        
        this.scene.add(laserGroup);
        this.interactableObjects.set('laserGrid', laserGroup);
    }
    
    createLaserBeams(parent) {
        const beamHeights = [0.5, 1.0, 1.5, 2.0];
        
        beamHeights.forEach((height, index) => {
            const beamGeo = new THREE.BoxGeometry(2, 0.01, 0.01);
            const beamMat = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            });
            
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set(0, height, 4);
            beam.userData = { 
                type: 'laserBeam', 
                index: index,
                active: true 
            };
            parent.add(beam);
            
            // Beam glow effect
            const glowGeo = new THREE.BoxGeometry(2, 0.05, 0.05);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xff4444,
                transparent: true,
                opacity: 0.3
            });
            
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.set(0, height, 4);
            parent.add(glow);
        });
    }
    
    setupEventListeners() {
        // Mouse interaction
        this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }
    
    onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Cast ray
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections with interactable objects
        const allObjects = [];
        this.scene.traverse((child) => {
            if (child.userData && (child.userData.clickable || child.userData.interactable)) {
                allObjects.push(child);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(allObjects, true);
        
        if (intersects.length > 0) {
            const clicked = intersects[0].object;
            this.handleInteraction(clicked);
        }
    }
    
    handleInteraction(object) {
        const userData = object.userData;
        
        switch (userData.type) {
            case 'victim':
                this.inspectVictim();
                break;
            case 'switch':
                this.toggleCircuitSwitch(userData.index);
                break;
            case 'cipherWheel':
                this.rotateCipherWheel(userData.index);
                break;
            case 'mirror':
                this.adjustMirror(userData.index);
                break;
            case 'vaultWheel':
                this.turnVaultWheel();
                break;
            case 'notebook':
                this.examineNotebook();
                break;
            case 'brassGear':
                this.collectBrassKey();
                break;
        }
    }
    
    inspectVictim() {
        const victim = this.interactableObjects.get('victim');
        if (!victim.userData.examined) {
            victim.userData.examined = true;
            this.showMessage("You discover a brass gear in the victim's hand and a cryptogram notebook nearby.", "evidence");
            this.gameState.keycards.brass = true;
            this.updateGameProgress();
        }
    }
    
    toggleCircuitSwitch(index) {
        const breaker = this.interactableObjects.get('circuitBreaker');
        breaker.userData.switchStates[index] = !breaker.userData.switchStates[index];
        
        // Visual feedback - rotate switch lever
        breaker.traverse((child) => {
            if (child.userData.type === 'switch' && child.userData.index === index) {
                child.rotation.x = breaker.userData.switchStates[index] ? Math.PI / 4 : -Math.PI / 4;
            }
        });
        
        // Check if correct sequence is achieved
        const correct = breaker.userData.correctSequence;
        const current = breaker.userData.switchStates;
        
        if (JSON.stringify(correct) === JSON.stringify(current)) {
            this.solvePowerPuzzle();
        }
        
        this.playSound('switchClick');
    }
    
    solvePowerPuzzle() {
        this.gameState.powerRestored = true;
        this.gameState.circuitSolved = true;
        
        // Activate hologram
        const hologram = this.interactableObjects.get('hologram');
        hologram.material.opacity = 0.6;
        hologram.userData.visible = true;
        
        // Update indicator lights
        this.scene.traverse((child) => {
            if (child.userData.type === 'indicator') {
                child.material.emissiveIntensity = child.userData.index === 2 ? 0.8 : 0.2;
            }
        });
        
        this.showMessage("Power restored! Holographic recording activated. Press H to view hologram.", "success");
        this.playSound('powerUp');
    }
    
    rotateCipherWheel(index) {
        const cipherDesk = this.interactableObjects.get('cipherDesk');
        cipherDesk.userData.wheelPositions[index] = (cipherDesk.userData.wheelPositions[index] + 1) % 4;
        
        // Visual rotation
        cipherDesk.traverse((child) => {
            if (child.userData.type === 'cipherWheel' && child.userData.index === index) {
                child.rotation.y = (cipherDesk.userData.wheelPositions[index] / 4) * Math.PI * 2;
            }
        });
        
        // Check solution
        const correct = cipherDesk.userData.correctSequence;
        const current = cipherDesk.userData.wheelPositions;
        
        if (JSON.stringify(correct) === JSON.stringify(current)) {
            this.solveCipherPuzzle();
        }
        
        this.playSound('mechanicalClick');
    }
    
    solveCipherPuzzle() {
        this.gameState.cipherUnlocked = true;
        this.gameState.keycards.blue = true;
        
        this.showMessage("Cipher solved! Blue keycard revealed in hidden compartment.", "success");
        this.createBlueKeycard();
        this.playSound('unlock');
    }
    
    createBlueKeycard() {
        const cardGeo = new THREE.BoxGeometry(0.15, 0.08, 0.005);
        const cardMat = new THREE.MeshStandardMaterial({
            color: 0x0066cc,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const card = new THREE.Mesh(cardGeo, cardMat);
        card.position.set(-2, 1.2, 1.5);
        card.userData = { type: 'blueKeycard', collectible: true };
        this.scene.add(card);
    }
    
    adjustMirror(index) {
        const prism = this.interactableObjects.get('prismChamber');
        prism.userData.mirrorAngles[index] = (prism.userData.mirrorAngles[index] + 45) % 360;
        
        // Visual rotation
        prism.traverse((child) => {
            if (child.userData.type === 'mirror' && child.userData.index === index) {
                child.rotation.z = (prism.userData.mirrorAngles[index] * Math.PI) / 180;
            }
        });
        
        // Check laser alignment (simplified)
        this.updateLaserAlignment();
        this.playSound('glassClick');
    }
    
    updateLaserAlignment() {
        const prism = this.interactableObjects.get('prismChamber');
        const angles = prism.userData.mirrorAngles;
        
        // Simplified solution: specific angle combinations hit targets
        const correctAngles = [45, 90, 135];
        let hits = 0;
        
        angles.forEach((angle, index) => {
            const hit = angle === correctAngles[index];
            prism.userData.targetsHit[index] = hit;
            
            // Update target visual feedback
            prism.traverse((child) => {
                if (child.userData.type === 'laserTarget' && child.userData.index === index) {
                    child.material.color.setHex(hit ? 0x00ff00 : 0x444444);
                    child.material.emissive.setHex(hit ? 0x004400 : 0x000000);
                    child.material.emissiveIntensity = hit ? 0.3 : 0;
                }
            });
            
            if (hit) hits++;
        });
        
        if (hits === 3) {
            this.solveLaserPuzzle();
        }
    }
    
    solveLaserPuzzle() {
        this.gameState.laserGridDisabled = true;
        this.gameState.keycards.red = true;
        
        // Disable laser grid
        const laserGrid = this.interactableObjects.get('laserGrid');
        laserGrid.traverse((child) => {
            if (child.userData.type === 'laserBeam') {
                child.visible = false;
            }
        });
        
        this.showMessage("Laser grid disabled! Red keycard acquired. Path to vault is clear.", "success");
        this.createRedKeycard();
        this.playSound('laserDisable');
    }
    
    createRedKeycard() {
        const cardGeo = new THREE.BoxGeometry(0.15, 0.08, 0.005);
        const cardMat = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const card = new THREE.Mesh(cardGeo, cardMat);
        card.position.set(3, 1.5, 4);
        card.userData = { type: 'redKeycard', collectible: true };
        this.scene.add(card);
    }
    
    turnVaultWheel() {
        const vault = this.interactableObjects.get('vaultDoor');
        
        // Check if all keycards are collected
        const allCards = Object.values(this.gameState.keycards).every(card => card);
        
        if (allCards && !vault.userData.opened) {
            vault.userData.opened = true;
            this.gameState.vaultOpened = true;
            
            // Animate vault opening
            vault.traverse((child) => {
                if (child.userData.type === 'vaultWheel') {
                    child.rotation.z += Math.PI * 2;
                }
            });
            
            this.showMessage("🎉 VAULT OPENED! Escape successful! Investigation complete.", "victory");
            this.playSound('vaultOpen');
            
            // Victory sequence
            setTimeout(() => {
                this.showVictoryScreen();
            }, 2000);
        } else {
            this.showMessage("All three keycards must be collected before the vault can be opened.", "warning");
        }
    }
    
    examineNotebook() {
        this.showMessage("Cryptogram notebook reveals geometric symbol sequence: Triangle, Circle, Square", "info");
        this.playSound('paperRustle');
    }
    
    collectBrassKey() {
        this.gameState.keycards.brass = true;
        this.showMessage("Brass gear collected - this might unlock something important.", "item");
        
        // Remove from scene
        this.scene.traverse((child) => {
            if (child.userData.type === 'brassGear') {
                this.scene.remove(child);
            }
        });
    }
    
    onMouseMove(event) {
        // Update mouse coordinates for hover effects
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Optional: Add hover highlighting
        this.updateHoverEffects();
    }
    
    updateHoverEffects() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const interactables = [];
        this.scene.traverse((child) => {
            if (child.userData && child.userData.clickable) {
                interactables.push(child);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(interactables, true);
        
        // Reset all hover states
        interactables.forEach(obj => {
            if (obj.material && obj.userData.hoverable !== false) {
                obj.material.emissiveIntensity = obj.userData.baseEmissive || 0;
            }
        });
        
        // Apply hover effect to intersected object
        if (intersects.length > 0) {
            const hovered = intersects[0].object;
            if (hovered.material && hovered.userData.hoverable !== false) {
                hovered.material.emissiveIntensity = 0.2;
                document.body.style.cursor = 'pointer';
            }
        } else {
            document.body.style.cursor = 'default';
        }
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyH':
                if (this.gameState.powerRestored) {
                    this.playHologramSequence();
                }
                break;
            case 'KeyR':
                this.resetPuzzles();
                break;
            case 'Escape':
                this.showHelpMenu();
                break;
        }
    }
    
    playHologramSequence() {
        const hologram = this.interactableObjects.get('hologram');
        
        if (hologram.userData.visible) {
            // Glitch animation
            let glitchCount = 0;
            const glitchInterval = setInterval(() => {
                hologram.material.opacity = Math.random() * 0.8;
                hologram.position.x += (Math.random() - 0.5) * 0.1;
                
                glitchCount++;
                if (glitchCount > 20) {
                    clearInterval(glitchInterval);
                    hologram.material.opacity = 0.6;
                    hologram.position.set(-3, 1, -3);
                    
                    this.showMessage("Hologram message: 'The vault code is hidden in the cipher wheels. Beware the laser grid.'", "hologram");
                }
            }, 100);
        }
    }
    
    resetPuzzles() {
        // Reset game state
        this.gameState = {
            powerRestored: false,
            circuitSolved: false,
            cipherUnlocked: false,
            laserGridDisabled: false,
            vaultOpened: false,
            keycards: { brass: false, blue: false, red: false }
        };
        
        // Reset visual elements
        this.resetCircuitBreaker();
        this.resetCipherDesk();
        this.resetPrismChamber();
        this.resetLaserGrid();
        this.resetVault();
        
        this.showMessage("All puzzles reset. Investigation restarted.", "info");
    }
    
    resetCircuitBreaker() {
        const breaker = this.interactableObjects.get('circuitBreaker');
        breaker.userData.switchStates = [false, false, false, false];
        
        breaker.traverse((child) => {
            if (child.userData.type === 'switch') {
                child.rotation.x = -Math.PI / 4;
            }
        });
    }
    
    resetCipherDesk() {
        const cipher = this.interactableObjects.get('cipherDesk');
        cipher.userData.wheelPositions = [0, 0, 0];
        
        cipher.traverse((child) => {
            if (child.userData.type === 'cipherWheel') {
                child.rotation.y = 0;
            }
        });
    }
    
    resetPrismChamber() {
        const prism = this.interactableObjects.get('prismChamber');
        prism.userData.mirrorAngles = [0, 0, 0];
        prism.userData.targetsHit = [false, false, false];
        
        prism.traverse((child) => {
            if (child.userData.type === 'mirror') {
                child.rotation.z = 0;
            }
            if (child.userData.type === 'laserTarget') {
                child.material.color.setHex(0x444444);
                child.material.emissive.setHex(0x000000);
            }
        });
    }
    
    resetLaserGrid() {
        const laser = this.interactableObjects.get('laserGrid');
        laser.traverse((child) => {
            if (child.userData.type === 'laserBeam') {
                child.visible = true;
            }
        });
    }
    
    resetVault() {
        const vault = this.interactableObjects.get('vaultDoor');
        vault.userData.opened = false;
        vault.userData.keycardSlots = [false, false, false];
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setupAudio() {
        // Initialize Web Audio API context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Define sound effects
        const soundDefs = {
            switchClick: { freq: 800, type: 'square', duration: 0.1 },
            mechanicalClick: { freq: 600, type: 'sawtooth', duration: 0.15 },
            powerUp: { freq: 440, type: 'sine', duration: 0.5 },
            unlock: { freq: 880, type: 'triangle', duration: 0.3 },
            glassClick: { freq: 1200, type: 'sine', duration: 0.08 },
            laserDisable: { freq: 220, type: 'square', duration: 0.8 },
            vaultOpen: { freq: 110, type: 'sawtooth', duration: 1.5 },
            paperRustle: { freq: 2000, type: 'square', duration: 0.2 }
        };
        
        // Generate sound buffers
        Object.entries(soundDefs).forEach(([name, def]) => {
            this.soundEffects.set(name, this.generateSound(def));
        });
    }
    
    generateSound(def) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = def.duration;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let value = 0;
            
            switch (def.type) {
                case 'sine':
                    value = Math.sin(2 * Math.PI * def.freq * t);
                    break;
                case 'square':
                    value = Math.sign(Math.sin(2 * Math.PI * def.freq * t));
                    break;
                case 'sawtooth':
                    value = 2 * (def.freq * t % 1) - 1;
                    break;
                case 'triangle':
                    value = 2 * Math.abs(2 * (def.freq * t % 1) - 1) - 1;
                    break;
            }
            
            // Apply envelope
            const envelope = Math.exp(-t * 5);
            data[i] = value * envelope * 0.1;
        }
        
        return buffer;
    }
    
    playSound(name) {
        if (!this.soundEffects.has(name)) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.soundEffects.get(name);
        source.connect(this.audioContext.destination);
        source.start();
    }
    
    showMessage(text, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `game-message message-${type}`;
        messageEl.textContent = text;
        
        // Style based on type
        const styles = {
            info: { bg: 'rgba(0, 123, 255, 0.9)', border: '#007bff' },
            success: { bg: 'rgba(40, 167, 69, 0.9)', border: '#28a745' },
            warning: { bg: 'rgba(255, 193, 7, 0.9)', border: '#ffc107' },
            evidence: { bg: 'rgba(0, 212, 255, 0.9)', border: '#00d4ff' },
            victory: { bg: 'rgba(255, 215, 0, 0.9)', border: '#ffd700' },
            hologram: { bg: 'rgba(0, 255, 255, 0.9)', border: '#00ffff' },
            item: { bg: 'rgba(138, 43, 226, 0.9)', border: '#8a2be2' }
        };
        
        const style = styles[type] || styles.info;
        
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${style.bg};
            border-left: 4px solid ${style.border};
            color: white;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            border-radius: 4px;
            max-width: 400px;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(messageEl);
        
        // Auto-remove after delay
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, type === 'victory' ? 5000 : 3000);
    }
    
    showVictoryScreen() {
        const victoryEl = document.createElement('div');
        victoryEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #000 0%, #1a1a2e 50%, #16213e 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Courier New', monospace;
            z-index: 2000;
            animation: fadeIn 1s ease-in;
        `;
        
        victoryEl.innerHTML = `
            <h1 style="font-size: 3rem; color: #00d4ff; text-shadow: 0 0 20px #00d4ff; margin-bottom: 20px;">
                🏆 INVESTIGATION COMPLETE 🏆
            </h1>
            <h2 style="font-size: 1.5rem; margin-bottom: 30px;">
                CyberVault Security Breach Resolved
            </h2>
            <div style="text-align: center; line-height: 1.6;">
                <p>✅ Power System Restored</p>
                <p>✅ Cipher Mechanism Decoded</p>
                <p>✅ Laser Security Disabled</p>
                <p>✅ Vault Successfully Opened</p>
            </div>
            <button id="restart-btn" style="
                margin-top: 30px;
                padding: 15px 30px;
                background: linear-gradient(45deg, #00d4ff, #0099cc);
                border: none;
                color: white;
                font-size: 1.2rem;
                font-weight: bold;
                cursor: pointer;
                border-radius: 5px;
            ">
                🔄 RESTART INVESTIGATION
            </button>
        `;
        
        document.body.appendChild(victoryEl);
        
        // Restart button functionality
        document.getElementById('restart-btn').addEventListener('click', () => {
            document.body.removeChild(victoryEl);
            this.resetPuzzles();
        });
    }
    
    showHelpMenu() {
        const helpEl = document.createElement('div');
        helpEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00d4ff;
            border-radius: 10px;
            padding: 30px;
            color: white;
            font-family: 'Courier New', monospace;
            z-index: 1500;
            max-width: 600px;
        `;
        
        helpEl.innerHTML = `
            <h2 style="color: #00d4ff; text-align: center; margin-bottom: 20px;">
                🔧 INVESTIGATION CONTROLS
            </h2>
            <div style="line-height: 1.8;">
                <p><strong>Mouse:</strong> Click to interact with objects</p>
                <p><strong>Mouse + Drag:</strong> Rotate camera view</p>
                <p><strong>Scroll Wheel:</strong> Zoom in/out</p>
                <p><strong>H Key:</strong> Play hologram (after power restored)</p>
                <p><strong>R Key:</strong> Reset all puzzles</p>
                <p><strong>ESC Key:</strong> Show this help menu</p>
            </div>
            <h3 style="color: #00d4ff; margin-top: 25px;">Investigation Objectives:</h3>
            <div style="line-height: 1.6;">
                <p>1. 🔍 Inspect the victim and collect evidence</p>
                <p>2. ⚡ Solve the circuit breaker power puzzle</p>
                <p>3. 🔐 Decode the cipher wheel mechanism</p>
                <p>4. 🔦 Disable the laser grid with mirrors</p>
                <p>5. 🚪 Open the vault with all three keycards</p>
            </div>
            <button id="close-help" style="
                display: block;
                margin: 20px auto 0;
                padding: 10px 20px;
                background: #00d4ff;
                border: none;
                color: black;
                font-weight: bold;
                cursor: pointer;
                border-radius: 5px;
            ">CLOSE</button>
        `;
        
        document.body.appendChild(helpEl);
        
        // Close button
        document.getElementById('close-help').addEventListener('click', () => {
            document.body.removeChild(helpEl);
        });
        
        // Close on ESC
        const closeOnEsc = (e) => {
            if (e.code === 'Escape') {
                document.body.removeChild(helpEl);
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
    }
    
    updateGameProgress() {
        // Calculate completion percentage
        const objectives = [
            this.gameState.powerRestored,
            this.gameState.circuitSolved,
            this.gameState.cipherUnlocked,
            this.gameState.laserGridDisabled,
            this.gameState.vaultOpened
        ];
        
        const completed = objectives.filter(obj => obj).length;
        const progress = Math.round((completed / objectives.length) * 100);
        
        // Update any UI progress indicators if they exist
        const progressEl = document.getElementById('investigation-progress');
        if (progressEl) {
            progressEl.textContent = `${progress}%`;
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Animate hologram glitch effect
        const hologram = this.interactableObjects.get('hologram');
        if (hologram && hologram.userData.visible) {
            hologram.userData.glitchTimer += 0.016;
            if (hologram.userData.glitchTimer > 3) {
                hologram.material.opacity = 0.6 + Math.sin(Date.now() * 0.01) * 0.1;
                hologram.position.y = 1 + Math.sin(Date.now() * 0.005) * 0.05;
            }
        }
        
        // Animate LED indicators
        this.scene.traverse((child) => {
            if (child.userData && child.userData.type === 'indicator' && child.userData.active) {
                child.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            }
        });
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize the 3D environment
document.addEventListener('DOMContentLoaded', () => {
    new CyberVault3D();
});

export default CyberVault3D;