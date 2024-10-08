//
// Atmospheric scattering vertex shader
//
// Author: Sean O'Neil
//
// Copyright (c) 2004 Sean O'Neil
//

// uniform vec3 v3CameraPos;		// The camera's current position
uniform vec3 v3LightPosition;		// The direction vector to the light source
uniform vec3 v3InvWavelength;	// 1 / pow(wavelength, 4) for the red, green, and blue channels
uniform float fCameraHeight;	// The camera's current height
uniform float fCameraHeight2;	// fCameraHeight^2
uniform float fOuterRadius;		// The outer (atmosphere) radius
uniform float fOuterRadius2;	// fOuterRadius^2
uniform float fInnerRadius;		// The inner (planetary) radius
uniform float fInnerRadius2;	// fInnerRadius^2
uniform float fKrESun;			// Kr * ESun
uniform float fKmESun;			// Km * ESun
uniform float fKr4PI;			// Kr * 4 * PI
uniform float fKm4PI;			// Km * 4 * PI
uniform float fScale;			// 1 / (fOuterRadius - fInnerRadius)
uniform float fScaleDepth;		// The scale depth (i.e. the altitude at which the atmosphere's average density is found)
uniform float fScaleOverScaleDepth;	// fScale / fScaleDepth
uniform sampler2D tDiffuse;  // added

// Added
varying vec3 v3Direction;
varying vec3 c0;
varying vec3 c1;
varying float vLightAngle; 
varying vec3 vNormal;
varying vec2 vUv;

uniform int nSamples;
uniform float fSamples;


float scale(float fCos)
{
	float x = 1.0 - fCos;
	return fScaleDepth * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));
}

void main(void)
{
	// Get the ray from the camera to the vertex and its length (which is the far point of the ray passing through the atmosphere)
	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	vec3 v3Pos = worldPosition.xyz;   // gl_Vertex.xyz;
	vec3 v3Ray = v3Pos - cameraPosition;
	float fFar = length(v3Ray);
	v3Ray /= fFar;

	// Calculate the closest intersection of the ray with the outer atmosphere (which is the near point of the ray passing through the atmosphere)
	float B = 2.0 * dot(cameraPosition, v3Ray);
	float C = fCameraHeight2 - fOuterRadius2;
	float fDet = max(0.0, B*B - 4.0 * C);
	float fNear = 0.5 * (-B - sqrt(fDet));

	// Calculate the ray's starting position, then calculate its scattering offset
	vec3 v3Start = cameraPosition + v3Ray * fNear;  // use threejs cameraPosition
	fFar -= fNear;
	float fDepth = exp((fInnerRadius - fOuterRadius) / fScaleDepth);
	float fCameraAngle = dot(-v3Ray, v3Pos) / length(v3Pos);
	float fLightAngle = dot(v3LightPosition, v3Pos) / length(v3Pos);
	float fCameraScale = scale(fCameraAngle);
	float fLightScale = scale(fLightAngle);
	float fCameraOffset = fDepth*fCameraScale;
	float fTemp = (fLightScale + fCameraScale);

	// Initialize the scattering loop variables
	float fSampleLength = fFar / fSamples;
	float fScaledLength = fSampleLength * fScale;
	vec3 v3SampleRay = v3Ray * fSampleLength;
	vec3 v3SamplePoint = v3Start + v3SampleRay * 0.5;

	// Now loop through the sample rays
	vec3 v3FrontColor = vec3(0.0, 0.0, 0.0);
	vec3 v3Attenuate;
	float fScatter;
	for(int i=0; i<nSamples; i++)
	{
		float fHeight = length(v3SamplePoint);
		float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fHeight));
		fScatter = fDepth*fTemp - fCameraOffset;
		v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI + fKm4PI));
		v3FrontColor += v3Attenuate * (fDepth * fScaledLength);
		v3SamplePoint += v3SampleRay;
	}

	// gl_FrontColor.rgb = v3FrontColor * (v3InvWavelength * fKrESun + fKmESun);

	// Calculate the attenuation factor for the ground
	// gl_FrontSecondaryColor.rgb = v3Attenuate;
	c0 = v3Attenuate;
	c1 = v3FrontColor * (v3InvWavelength * fKrESun + fKmESun);

	// gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	// gl_TexCoord[0] = gl_TextureMatrix[0] * gl_MultiTexCoord0;
	// gl_TexCoord[1] = gl_TextureMatrix[1] * gl_MultiTexCoord1;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);  // modified
	vUv = uv;          // get UV coords from ThreeJS 
	vNormal = normal;  // get normal coords from ThreeJS 
	vLightAngle = exp(-fScatter); 
}
