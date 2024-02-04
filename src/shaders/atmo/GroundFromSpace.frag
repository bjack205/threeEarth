//
// Atmospheric scattering fragment shader
//
// Author: Sean O'Neil
//
// Copyright (c) 2004 Sean O'Neil
//

//uniform sampler2D s2Tex1;
//uniform sampler2D s2Tex2;

uniform float fNightScale;
uniform vec3 v3LightPosition;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuseNight;

varying vec3 v3Direction;
varying vec3 c0;
varying vec3 c1;
varying float vLightAngle;
varying vec3 vNormal;
varying vec2 vUv;

void main (void)
{
	// gl_FragColor = gl_Color + 0.25 * gl_SecondaryColor;
	//gl_FragColor = gl_Color + texture2D(s2Tex1, gl_TexCoord[0].st) * texture2D(s2Tex2, gl_TexCoord[1].st) * gl_SecondaryColor;

	vec3 diffuseTexture = texture2D(tDiffuse, vUv).xyz;
	vec3 diffuseNightTexture = texture2D(tDiffuseNight, vUv).xyz;

	float alpha = clamp(vLightAngle, 0.0, 1.0);
	vec3 day = diffuseTexture * c0;

	float beta = 0.5;
	float nightFade = clamp((beta - alpha) / beta, 0.0, 1.0);
	vec3 night = fNightScale * diffuseNightTexture * nightFade;

	gl_FragColor = vec4(c1, 1.0) * 1.0 + vec4(night + day, 1.0);
}
