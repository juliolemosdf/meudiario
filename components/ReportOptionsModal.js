import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ReportOptionsModal = ({ visible, setVisible, handleGenerateReport }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.reportOptionsContainer}>
          <TouchableOpacity
            style={styles.reportOption}
            onPress={() => {
              handleGenerateReport('text');
              setVisible(false);
            }}
          >
            <Text style={styles.reportOptionText}>Text Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reportOption}
            onPress={() => {
              handleGenerateReport('image');
              setVisible(false);
            }}
          >
            <Text style={styles.reportOptionText}>Images Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reportOption}
            onPress={() => {
              handleGenerateReport('all');
              setVisible(false);
            }}
          >
            <Text style={styles.reportOptionText}>All Content</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportOption, styles.cancelOption]}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
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
  reportOptionsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  reportOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  reportOptionText: {
    fontSize: 16,
    color: '#075E54',
    textAlign: 'center',
  },
  cancelOption: {
    borderBottomWidth: 0,
  },
  cancelOptionText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ReportOptionsModal;
