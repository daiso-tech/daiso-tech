import { fileSystem } from './file-system';

describe('fileSystem', () => {
  it('should work', () => {
    expect(fileSystem()).toEqual('file-system');
  });
});
