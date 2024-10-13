import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

const MediaCaptionModal = ({ visible, onClose, onSubmit, mediaUri, mediaType }) => {
  const [caption, setCaption] = useState('');

  const handleSend = () => {
    onSubmit(caption);
    setCaption('');
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Adicionar Legenda</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Digite uma legenda..."
            value={caption}
            onChangeText={setCaption}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 40,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000',
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#075E54',
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
  },
});

export default MediaCaptionModal;
