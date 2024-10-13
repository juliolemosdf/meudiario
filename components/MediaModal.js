import React from 'react';
import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Video } from 'react-native';
import AudioPlayer from './AudioPlayer';

const MediaModal = ({ selectedMedia, setSelectedMedia }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={selectedMedia !== null}
      onRequestClose={() => setSelectedMedia(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.mediaModalContent}>
          {selectedMedia?.type === 'image' && (
            <Image
              source={{ uri: selectedMedia.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
          {selectedMedia?.type === 'video' && (
            <Video
              source={{ uri: selectedMedia.uri }}
              style={styles.fullVideo}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          )}
          {selectedMedia?.type === 'audio' && (
            <AudioPlayer uri={selectedMedia.uri} />
          )}
          <TouchableOpacity
            onPress={() => setSelectedMedia(null)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mediaModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
  },
  fullVideo: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#075E54',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MediaModal;
