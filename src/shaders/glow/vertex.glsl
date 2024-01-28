uniform vec3 uCameraPosition;
uniform vec3 viewVector;
uniform float scale;
uniform float c;
uniform float p;
uniform float s;
varying float intensity;
void main() 
{
    vec3 vNormal = normalize( normal );
	vec3 vNormel = normalize( viewVector );
	// intensity = pow( cross(vNormal, vNormel) + c, p );
    float distToCamera = distance( uCameraPosition, position );
    float distanceScaling = 1.0 / (1.0 + exp(c * (distToCamera - s))) * scale;
    vec3 v = cross( vNormal, vNormel );
    intensity = pow(length(v), p); 
    intensity *= distanceScaling ;
	
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}