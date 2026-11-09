export * from './roban-renderer.mock.mjs';
import { WebGLRenderer as RendererStub } from './roban-renderer.mock.mjs';
export class WebGLRenderer extends RendererStub { setClearColor() {} }
