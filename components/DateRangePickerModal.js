import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DateRangePickerModal = ({ visible, onClose, onConfirm }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  
  const [endDate, setEndDate] = useState(new Date());
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const handleStartChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
  };
  
  const handleEndChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      if (selectedDate < startDate) {
        setStartDate(selectedDate);
      }
    }
  };
  
  const handleConfirm = () => {
    onConfirm(startDate, endDate);
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Selecionar Intervalo de Datas</Text>
          
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>Data de Início: {startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartChange}
            />
          )}
          
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>Data de Fim: {endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndChange}
            />
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex:1,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent:'center',
    alignItems:'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius:10,
    padding:20,
    alignItems:'center',
  },
  title: {
    fontSize:18,
    marginBottom:20,
    textAlign:'center',
  },
  dateButton: {
    width:'100%',
    padding:10,
    backgroundColor:'#f0f0f0',
    borderRadius:5,
    marginBottom:10,
  },
  dateButtonText: {
    fontSize:16,
    color:'#333',
  },
  buttonContainer: {
    flexDirection:'row',
    justifyContent:'space-between',
    marginTop:20,
    width:'100%',
  },
  cancelButton: {
    flex:1,
    padding:10,
    backgroundColor:'#E8E8E8',
    borderRadius:5,
    marginRight:5,
    alignItems:'center',
  },
  cancelButtonText: {
    color:'#000',
  },
  confirmButton: {
    flex:1,
    padding:10,
    backgroundColor:'#075E54',
    borderRadius:5,
    marginLeft:5,
    alignItems:'center',
  },
  confirmButtonText: {
    color:'#FFF',
  },
});

export default DateRangePickerModal;
