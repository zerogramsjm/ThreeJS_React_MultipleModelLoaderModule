import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import Loader from './Loader.js';

import objectUploadPlaceholder from 'images/object-upload-placeholder.png';

let dropZoneArea;

const DropZoneWrapper = styled.div`
  height: 100%;
  z-index: 0;
  position: absolute;
  width: 100%;
  &:focus {
    outline: none;
    border: none;
    outline-width: 0;
  ${({ active }) =>
    active &&
    `
`}
`;

const LogoWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  padding-bottom: 30px;
  transform: translate(-50%, -50%);
  :hover {
    cursor: pointer;
  }
  ${({ active }) =>
    active &&
    `
    display: none;
`}
`;

const LogoDiv = styled.div`
  height: 180px;
  width: 200px;
  background-image: url(${objectUploadPlaceholder});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: 50% 50%;
`;

const LoadingText = styled.h3`
  color: #99b8c3;
  font-size: 23px;
  font-weight: 100;
`;

const DropZone = props => {
  const onDrop = useCallback(acceptedFiles => {
    const files = [];
    for (let i = 0; i < acceptedFiles.length; i += 1) {
      console.log('acceptedFiles[i]: ', acceptedFiles[i]);
      files.push(acceptedFiles[i]);
    }
    const fileLoader = new Loader(obj => obj);
    fileLoader.loadFiles(files);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  if (props.isLoading) {
    dropZoneArea = <LoadingText>Loading Model</LoadingText>;
  } else {
    dropZoneArea = (
      <>
        <LogoDiv />
        <p style={{color: "#949494"}}>Drag n drop your 3d files, or click to select</p>
      </>
    );
  }

  return (
    <DropZoneWrapper {...getRootProps()} active={props.active}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p style={{position: "absolute", top: "45%", left: "40%", color: "#949494"}}>Drag n drop your 3d files, or click to select</p>
      ) : (
        <LogoWrapper active={props.active}>{dropZoneArea}</LogoWrapper>
      )}
    </DropZoneWrapper>
  );
};

export default DropZone;