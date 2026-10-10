import * as THREE from 'three'
import { once, noiseTexture } from './textures'

// A handful of materials reused by every prop (one GPU program and uniform set instead of hundreds)
const bump = once('noise', noiseTexture)
const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o)
export const M = {
  brass: std({ color: '#b08d3a', metalness: 0.75, roughness: 0.38, bumpMap: bump, bumpScale: 0.6 }),
  gold: std({ color: '#d9a441', metalness: 0.8, roughness: 0.3 }),
  wood: std({ color: '#6b4426', roughness: 0.7, bumpMap: bump, bumpScale: 0.5 }),
  cream: std({ color: '#e9dcb4', roughness: 0.9, bumpMap: bump, bumpScale: 0.3 }),
  cloth: std({ color: '#7a1c2a', roughness: 0.95, bumpMap: bump, bumpScale: 1.2 }),
}
