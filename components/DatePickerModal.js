import React from 'react';
import { Modal, View, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const DatePickerModal = ({ visible, setVisible, handleDateChange }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
          <TouchableOpacity
            onPress={() => setVisible(false)}
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
  datePickerContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: width * 0.8,
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

export default DatePickerModal;
