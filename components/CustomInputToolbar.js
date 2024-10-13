import React from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet } from 'react-native';
import { InputToolbar, Composer } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';

const CustomInputToolbar = (props) => {
  const {
    text,
    setText,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    handlePickImage,
    handlePickVideo,
    onSend,
  } = props;

  const handleSendPress = () => {
    if (text.trim().length > 0) {
      const newMessage = {
        _id: uuidv4(),
        text: text,
        createdAt: new Date(),
        user: { _id: 1 },
      };
      onSend([newMessage]);
      setText('');
    }
  };

  return (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={{ alignItems: 'center' }}
      renderComposer={(composerProps) => (
        <View style={styles.composerContainer}>
          <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
            <Ionicons name="image" size={24} color="#075E54" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickVideo} style={styles.iconButton}>
            <Ionicons name="videocam" size={24} color="#075E54" />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            {isRecording ? (
              <Text style={styles.recordingDuration}>{recordingDuration}s</Text>
            ) : (
              <Composer
                {...composerProps}
                text={text}
                onTextChanged={setText}
                textInputStyle={styles.composer}
              />
            )}
          </View>
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={styles.iconButton}
          >
            <Ionicons name="mic" size={24} color="#075E54" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSendPress} style={styles.iconButton}>
            <Ionicons name="send" size={24} color="#075E54" />
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  composer: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
    minHeight: 40,
  },
  iconButton: {
    padding: 5,
  },
  recordingDuration: {
    color: '#075E54',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CustomInputToolbar;
