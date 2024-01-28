uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying float vIntensity;

void main() {
    vec3 sunDirection = vec3(0.0, 0.0, 1.0);
    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);

    float intensity = pow(0.5 - dot(vNormal, vec3(0, 0, 1.0)), 2.0); 
    vec3 atmosphere = atmosphereColor * intensity; 
    // vec4 textureColor = texture2D(uTexture, vUv);
    // textureColor.rgb += atmosphere; 
    // vec3 atmosphere = atmosphereColor * vIntensity;
    gl_FragColor = vec4(atmosphere, 1.0);
}