import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ setShowDatePicker, handleClearAsyncStorage, setShowReportOptions }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => {}} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Image
        source={require('../assets/avatar.jpg')}
        style={styles.avatar}
      />
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Minhas Anotações</Text>
        <Text style={styles.headerSubtitle}>By Júlio Lemos</Text>
      </View>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.calendarButton}>
        <Ionicons name="calendar" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleClearAsyncStorage} style={styles.trashButton}>
        <Ionicons name="trash" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowReportOptions(true)} style={styles.reportButton}>
        <Ionicons name="document-text" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#075E54',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  calendarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  trashButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;
