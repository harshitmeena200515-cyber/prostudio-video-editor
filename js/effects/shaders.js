/**
 * WebGL Shaders
 * Core GLSL shader programs for GPU-accelerated video effects.
 */

export const Shaders = {
    vertex: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `,

    // Base pass-through fragment shader
    fragmentBase: `
        precision mediump float;
        uniform sampler2D u_image;
        varying vec2 v_texCoord;
        void main() {
            gl_FragColor = texture2D(u_image, v_texCoord);
        }
    `,

    // Color Grading (CDL implementation)
    fragmentColorGrade: `
        precision mediump float;
        uniform sampler2D u_image;
        uniform vec3 u_gain;
        uniform vec3 u_gamma;
        uniform vec3 u_offset;
        uniform float u_saturation;
        varying vec2 v_texCoord;
        
        void main() {
            vec4 color = texture2D(u_image, v_texCoord);
            
            // CDL: out = (in * gain + offset) ^ gamma
            vec3 graded = pow(max(color.rgb * u_gain + u_offset, 0.0), u_gamma);
            
            // Saturation
            float luma = dot(graded, vec3(0.2126, 0.7152, 0.0722));
            graded = mix(vec3(luma), graded, u_saturation);
            
            gl_FragColor = vec4(graded, color.a);
        }
    `,

    // Transition: Cross Dissolve
    fragmentTransitionDissolve: `
        precision mediump float;
        uniform sampler2D u_imageFrom;
        uniform sampler2D u_imageTo;
        uniform float u_progress;
        varying vec2 v_texCoord;
        
        void main() {
            vec4 c1 = texture2D(u_imageFrom, v_texCoord);
            vec4 c2 = texture2D(u_imageTo, v_texCoord);
            gl_FragColor = mix(c1, c2, u_progress);
        }
    `,

    // Effect: Gaussian Blur (simplified 1-pass for example)
    fragmentBlur: `
        precision mediump float;
        uniform sampler2D u_image;
        uniform vec2 u_resolution;
        uniform float u_radius;
        varying vec2 v_texCoord;
        
        void main() {
            vec4 color = vec4(0.0);
            float total = 0.0;
            
            vec2 offset = vec2(1.0) / u_resolution;
            
            for (float x = -2.0; x <= 2.0; x++) {
                for (float y = -2.0; y <= 2.0; y++) {
                    float weight = 1.0 - (length(vec2(x, y)) / 3.0);
                    if (weight > 0.0) {
                        color += texture2D(u_image, v_texCoord + vec2(x, y) * offset * u_radius) * weight;
                        total += weight;
                    }
                }
            }
            
            gl_FragColor = color / total;
        }
    `
};
