import 'react-native-reanimated';
import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  Animated,
  Modal,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  ActionSheetIOS,
  TextInput,
  ScrollView,
} from 'react-native';
import { GiftedChat, InputToolbar, Composer, Bubble } from 'react-native-gifted-chat';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

export const generateHTMLContent = async (messages, userName) => {
  let content = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f3f2ef;
          }
          .timeline {
            position: relative;
            padding-left: 20px;
          }
          .timeline::before {
            content: '';
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #0a66c2;
          }
          .message {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            position: relative;
          }
          .message::before {
            content: '';
            position: absolute;
            left: -34px;
            top: 20px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #0a66c2;
            border: 2px solid white;
          }
          .image-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-bottom: 10px;
          }
          .image-pair {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .image-pair img {
            width: 48%;
            height: auto;
            border-radius: 4px;
          }
          .single-image img {
            width: 100%;
            height: auto;
            border-radius: 4px;
          }
          .caption {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
            text-align: center;
          }
          .timestamp {
            font-size: 12px;
            color: #0a66c2;
            margin-top: 10px;
            text-align: right;
          }
          h1 {
            text-align: center;
            color: #0a66c2;
          }
        </style>
      </head>
      <body>
        <h1>Relatório de Chat</h1>
        <div class="timeline">
  `;

  const comparativePairs = {};
  messages.forEach((msg) => {
    if (msg.comparativeId) {
      if (!comparativePairs[msg.comparativeId]) {
        comparativePairs[msg.comparativeId] = [];
      }
      comparativePairs[msg.comparativeId].push(msg);
    }
  });

  for (const msg of messages) {
    if (msg.comparativeId && comparativePairs[msg.comparativeId]) {
      if (comparativePairs[msg.comparativeId].processed) continue;

      const [firstMsg, secondMsg] = comparativePairs[msg.comparativeId];
      content += `<div class="message">`;
      try {
        const base64First = await FileSystem.readAsStringAsync(firstMsg.image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const base64Second = await FileSystem.readAsStringAsync(secondMsg.image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        content += `
          <div class="image-container">
            <div class="image-pair">
              <img src="data:image/png;base64,${base64First}" alt="${firstMsg.text}" />
              <img src="data:image/png;base64,${base64Second}" alt="${secondMsg.text}" />
            </div>
            <div class="caption">${firstMsg.text} vs ${secondMsg.text}</div>
          </div>
        `;
      } catch (error) {
        console.error('Error reading comparative images:', error);
      }
      content += `<div class="timestamp">${new Date(msg.createdAt).toLocaleString()}</div></div>`;
      comparativePairs[msg.comparativeId].processed = true;
    } else {
      content += `<div class="message">`;
      if (msg.type === 'text' && msg.text && !msg.image && !msg.video && !msg.audio) {
        content += `<p>${msg.text}</p>`;
      }
      if (msg.type === 'single' && msg.image) {
        try {
          const base64Image = await FileSystem.readAsStringAsync(msg.image, {
            encoding: FileSystem.EncodingType.Base64,
          });
          content += `
            <div class="image-container">
              <div class="single-image">
                <img src="data:image/png;base64,${base64Image}" alt="Imagem" />
              </div>
              ${msg.text ? `<div class="caption">${msg.text}</div>` : ''}
            </div>
          `;
        } catch (error) {
          console.error('Error reading image file:', error);
        }
      }
      if (msg.type === 'video' && msg.video) {
        content += `<p>[Vídeo não suportado na visualização do relatório]</p>`;
        if (msg.text) {
          content += `<div class="caption">Vídeo - ${msg.text}</div>`;
        }
      }
      if (msg.type === 'audio' && msg.audio) {
        content += `<p>[Áudio não suportado na visualização do relatório]</p>`;
        if (msg.text) {
          content += `<div class="caption">Áudio - ${msg.text}</div>`;
        }
      }
      content += `<div class="timestamp">${new Date(msg.createdAt).toLocaleString()}</div></div>`;
    }
  }

  content += '</div></body></html>';
  return content;
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [animationValue] = useState(new Animated.Value(0));
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterType, setFilterType] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [text, setText] = useState('');
  const [storageKey, setStorageKey] = useState('@v01_messages');
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [user, setUser] = useState({ name: '', avatar: '' });
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState(null);
  const [showImageOptionsModal, setShowImageOptionsModal] = useState(false);
  const [comparativeImages, setComparativeImages] = useState([]);
  const [comparativeId, setComparativeId] = useState(null);
  const [showCaptionInputModal, setShowCaptionInputModal] = useState(false);
  const [imageToSend, setImageToSend] = useState(null);
  const [caption, setCaption] = useState('');
  const [isComparativeMode, setIsComparativeMode] = useState(false);

  useEffect(() => {
    requestPermissions();
    checkUserSetup();
  }, []);

  useEffect(() => {
    if (user.name && user.avatar) {
      loadMessagesByDate(new Date().toDateString());
    }
  }, [user]);

  const requestPermissions = async () => {
    const imageStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (imageStatus.status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas imagens.');
    }

    const audioStatus = await Audio.requestPermissionsAsync();
    if (audioStatus.status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso ao microfone.');
    }
  };

  const checkUserSetup = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user_info');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setShowUserSetup(true);
      }
    } catch (error) {
      console.error('Error checking user setup:', error);
    }
  };

  const saveUserSetup = async () => {
    if (!tempName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome.');
      return;
    }

    if (!tempAvatar) {
      Alert.alert('Erro', 'Por favor, selecione uma foto de perfil.');
      return;
    }

    const userData = {
      name: tempName.trim(),
      avatar: tempAvatar,
    };

    try {
      await AsyncStorage.setItem('@user_info', JSON.stringify(userData));
      setUser(userData);
      setShowUserSetup(false);
    } catch (error) {
      console.error('Error saving user setup:', error);
      Alert.alert('Erro', 'Não foi possível salvar as informações do usuário.');
    }
  };

  const onSend = useCallback(
    (newMessages = []) => {
      const sortedNewMessages = newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages((previousMessages) => {
        const updatedMessages = GiftedChat.append(previousMessages, sortedNewMessages);
        saveMessages(updatedMessages);
        return updatedMessages;
      });
      setText('');
    },
    [messages]
  );

  const saveMessages = async (messagesToSave) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const loadMessagesByDate = async (dateString) => {
    try {
      const storedMessages = await AsyncStorage.getItem(storageKey);
      if (storedMessages !== null) {
        const allMessages = JSON.parse(storedMessages);
        const messagesByDate = allMessages.filter(
          (msg) => new Date(msg.createdAt).toDateString() === dateString
        );

        messagesByDate.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        setMessages(messagesByDate);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handlePickImage = () => {
    setShowImageOptionsModal(true);
  };

  const handleSingleImagePick = async () => {
    setShowImageOptionsModal(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageToSend(result.assets[0].uri);
      setCaption('');
      setShowCaptionInputModal(true);
      setIsComparativeMode(false);
    }
  };

  const handleComparativeImagePick = async () => {
    setShowImageOptionsModal(false);
    setComparativeImages([]);
    setComparativeId(uuidv4());
    setIsComparativeMode(true);
    pickComparativeImage();
  };

  const pickComparativeImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageToSend(result.assets[0].uri);
      setCaption('');
      setShowCaptionInputModal(true);
    } else {
      setIsComparativeMode(false);
    }
  };

  const handlePickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });

    if (!result.canceled) {
      onSend([
        {
          _id: uuidv4(),
          createdAt: new Date(),
          user: { _id: 1, name: user.name, avatar: user.avatar },
          video: result.assets[0].uri,
          type: 'video',
          text: '',
        },
      ]);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recordingInstance.startAsync();

      setRecording(recordingInstance);
      setIsRecording(true);
      setRecordingDuration(0);

      Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      setRecordingInterval(interval);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      animationValue.setValue(0);
      clearInterval(recordingInterval);

      if (recordingDuration >= 2) {
        onSend([
          {
            _id: uuidv4(),
            createdAt: new Date(),
            type: 'audio',
            user: { _id: 1, name: user.name, avatar: user.avatar },
            audio: uri,
            text: '',
          },
        ]);
      } else {
        Alert.alert('Gravação muito curta', 'A gravação deve ter mais de 2 segundos.');
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  const renderMessageAudio = (props) => {
    const { currentMessage } = props;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedMedia({ type: 'audio', uri: currentMessage.audio });
        }}
        style={styles.audioButton}
      >
        <Ionicons name="play" size={24} color="#075E54" />
        <Text style={styles.audioButtonText}>Reproduzir Áudio</Text>
      </TouchableOpacity>
    );
  };

  const renderMessageVideo = (props) => {
    const { currentMessage } = props;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedMedia({ type: 'video', uri: currentMessage.video });
        }}
      >
        <Video
          source={{ uri: currentMessage.video }}
          style={{ width: 200, height: 150, borderRadius: 10 }}
          useNativeControls
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  const renderMessageImage = (props) => {
    const { currentMessage } = props;

    if (currentMessage.type === 'single' && currentMessage.image) {
      let borderColor = '#000';
      if (currentMessage.comparativeIndex === 1) borderColor = 'yellow';
      if (currentMessage.comparativeIndex === 2) borderColor = 'green';

      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedMedia({ type: 'single', uri: currentMessage.image, label: currentMessage.text });
          }}
          onLongPress={() => {
            handleLongPress(null, currentMessage);
          }}
        >
          <Image
            source={{ uri: currentMessage.image }}
            style={{ width: 250, height: 200, borderRadius: 10, borderWidth: 5, borderColor }}
          />
          {currentMessage.text ? (
            <Text style={styles.imageCaption}>{currentMessage.text}</Text>
          ) : null}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const filterMessages = (messages, type) => {
    if (!type) return messages;
    return messages.filter((message) => {
      if (type === 'text' && message.type === 'text' && message.text) return true;
      if (type === 'image' && (message.type === 'single')) return true;
      if (type === 'video' && message.type === 'video') return true;
      if (type === 'audio' && message.type === 'audio') return true;
      return false;
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toDateString();
      loadMessagesByDate(dateString);
    }
  };

  const handleClearAsyncStorage = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza de que deseja apagar todas as mensagens?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(storageKey);
              setMessages([]);
              const newKey = `@v01_messages_${Math.floor(Math.random() * 1000000)}`;
              setStorageKey(newKey);
              Alert.alert('Sucesso', 'Todas as mensagens foram apagadas.');
            } catch (error) {
              console.error('Erro ao apagar mensagens:', error);
              Alert.alert('Erro', 'Não foi possível apagar as mensagens.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderInputToolbarCustom = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={{ alignItems: 'center' }}
        renderComposer={(composerProps) => renderComposer(composerProps)}
      />
    );
  };

  const renderComposer = (props) => {
    const handleSendPress = () => {
      if (text.trim().length > 0) {
        const newMessage = {
          _id: uuidv4(),
          text: text,
          createdAt: new Date(),
          type: 'text',
          user: { _id: 1, name: user.name, avatar: user.avatar },
        };
        onSend([newMessage]);
        setText('');
      }
    };

    return (
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
              {...props}
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
    );
  };

  const handleLongPress = (context, message) => {
    const options = ['Apagar Mensagem', 'Cancelar'];
    const cancelButtonIndex = 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleDeleteMessage(message._id);
          }
        }
      );
    } else {
      Alert.alert(
        'Opções',
        '',
        [
          {
            text: 'Apagar Mensagem',
            onPress: () => handleDeleteMessage(message._id),
            style: 'destructive',
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const updatedMessages = messages.filter((msg) => msg._id !== messageId);
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#DCF8C6',
          },
          left: {
            backgroundColor: '#FFFFFF',
          },
        }}
        textStyle={{
          right: {
            color: '#000000',
          },
          left: {
            color: '#000000',
          },
        }}
      />
    );
  };

  const handleGenerateReport = async (reportType) => {
    let filteredMessages;
    switch (reportType) {
      case 'text':
        filteredMessages = messages.filter((msg) => msg.type === 'text');
        break;
      case 'image':
        filteredMessages = messages.filter((msg) => msg.type === 'single');
        break;
      case 'all':
        filteredMessages = messages;
        break;
      default:
        filteredMessages = messages;
    }

    try {
      const htmlContent = await generateHTMLContent(filteredMessages, user.name);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Erro', 'Falha ao gerar o relatório');
    }
  };

  const handleSendImageWithCaption = () => {
    const newMessage = {
      _id: uuidv4(),
      createdAt: new Date(),
      type: 'single',
      user: { _id: 1, name: user.name, avatar: user.avatar },
      image: imageToSend,
      text: caption,
    };

    if (isComparativeMode) {
      newMessage.comparativeId = comparativeId;
      newMessage.comparativeIndex = comparativeImages.length + 1;
      setComparativeImages([...comparativeImages, newMessage]);

      if (comparativeImages.length + 1 === 2) {
        setIsComparativeMode(false);
        setComparativeId(null);
      } else {
        pickComparativeImage();
      }
    }

    onSend([newMessage]);
    setShowCaptionInputModal(false);
    setImageToSend(null);
    setCaption('');
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ECE5DD' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {}} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={user.avatar ? { uri: user.avatar } : require('./assets/avatar.jpg')}
            style={styles.avatar}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{user.name || 'Usuário'}</Text>
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -500}
        >
          <GiftedChat
            messages={filterMessages(messages, filterType).sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            )}
            onSend={(messages) => onSend(messages)}
            user={{ _id: 1, name: user.name, avatar: user.avatar }}
            renderMessageAudio={renderMessageAudio}
            renderMessageVideo={renderMessageVideo}
            renderMessageImage={renderMessageImage}
            renderInputToolbar={renderInputToolbarCustom}
            renderBubble={renderBubble}
            renderAvatar={(props) => (
              <Image source={{ uri: props.currentMessage.user.avatar }} style={styles.messageAvatar} />
            )}
            text={text}
            onInputTextChanged={setText}
            inverted={false}
            onLongPress={handleLongPress}
            listViewProps={{
              style: { flex: 1 },
              contentContainerStyle: { flexGrow: 1, justifyContent: 'flex-end' },
            }}
          />

          {showDatePicker && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={selectedMedia !== null}
            onRequestClose={() => setSelectedMedia(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.mediaModalContent}>
                {selectedMedia?.type === 'single' && (
                  <>
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                    {selectedMedia.label ? (
                      <Text style={styles.modalImageCaption}>{selectedMedia.label}</Text>
                    ) : null}
                  </>
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
                {selectedMedia?.type === 'audio' && <AudioPlayer uri={selectedMedia.uri} />}
                <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={showReportOptions}
            onRequestClose={() => setShowReportOptions(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.reportOptionsContainer}>
                <TouchableOpacity
                  style={styles.reportOption}
                  onPress={() => {
                    handleGenerateReport('text');
                    setShowReportOptions(false);
                  }}
                >
                  <Text style={styles.reportOptionText}>Somente Texto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reportOption}
                  onPress={() => {
                    handleGenerateReport('image');
                    setShowReportOptions(false);
                  }}
                >
                  <Text style={styles.reportOptionText}>Somente Imagens</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reportOption}
                  onPress={() => {
                    handleGenerateReport('all');
                    setShowReportOptions(false);
                  }}
                >
                  <Text style={styles.reportOptionText}>Todo o Conteúdo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reportOption, styles.cancelOption]}
                  onPress={() => setShowReportOptions(false)}
                >
                  <Text style={[styles.reportOptionText, styles.cancelOptionText]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal animationType="slide" transparent={true} visible={showUserSetup} onRequestClose={() => {}}>
            <View style={styles.modalOverlay}>
              <ScrollView contentContainerStyle={styles.userSetupContainer}>
                <Text style={styles.userSetupTitle}>Configurar Usuário</Text>
                <TextInput
                  placeholder="Digite seu nome"
                  value={tempName}
                  onChangeText={setTempName}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  onPress={async () => {
                    let result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [1, 1],
                      quality: 1,
                    });

                    if (!result.canceled) {
                      setTempAvatar(result.assets[0].uri);
                    }
                  }}
                  style={styles.avatarPickerButton}
                >
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                  <Text style={styles.avatarPickerButtonText}>Selecionar Foto de Perfil</Text>
                </TouchableOpacity>
                {tempAvatar && <Image source={{ uri: tempAvatar }} style={styles.selectedAvatar} />}
                <TouchableOpacity onPress={saveUserSetup} style={styles.saveUserButton}>
                  <Text style={styles.saveUserButtonText}>Salvar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={showImageOptionsModal}
            onRequestClose={() => setShowImageOptionsModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.imageOptionsContainer}>
                <Text style={styles.imageOptionsTitle}>Escolha o Tipo de Imagem</Text>
                <TouchableOpacity style={styles.imageOptionButton} onPress={handleSingleImagePick}>
                  <Text style={styles.imageOptionText}>Foto Única</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageOptionButton} onPress={handleComparativeImagePick}>
                  <Text style={styles.imageOptionText}>Foto Comparativa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageOptionButton, styles.cancelOption]}
                  onPress={() => setShowImageOptionsModal(false)}
                >
                  <Text style={[styles.imageOptionText, styles.cancelOptionText]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={showCaptionInputModal}
            onRequestClose={() => setShowCaptionInputModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.labelInputContainer}>
                <Text style={styles.labelInputTitle}>Insira a Legenda</Text>
                <TextInput
                  placeholder="Legenda para a imagem"
                  value={caption}
                  onChangeText={setCaption}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  onPress={handleSendImageWithCaption}
                  style={styles.saveUserButton}
                >
                  <Text style={styles.saveUserButtonText}>Enviar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowCaptionInputModal(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const AudioPlayer = ({ uri }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSound = async () => {
    try {
      const { sound: soundObj } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setSound(soundObj);
      setIsPlaying(true);

      soundObj.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.audioPlayerContainer}>
      <TouchableOpacity onPress={isPlaying ? stopSound : playSound} style={styles.audioPlayerButton}>
        <Ionicons name={isPlaying ? 'stop' : 'play'} size={24} color="#075E54" />
        <Text style={styles.audioPlayerText}>{isPlaying ? 'Parar' : 'Reproduzir Áudio'}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    marginRight: 10,
  },
  reportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginBottom: 10,
  },
  modalImageCaption: {
    marginTop: 5,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  fullVideo: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
    marginBottom: 10,
  },
  imageCaption: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  audioButtonText: {
    marginLeft: 5,
    color: '#075E54',
    fontWeight: 'bold',
  },
  audioPlayerContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  audioPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  audioPlayerText: {
    marginLeft: 10,
    color: '#075E54',
    fontWeight: 'bold',
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
  userSetupContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: width * 0.9,
  },
  userSetupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#075E54',
  },
  textInput: {
    width: '100%',
    borderColor: '#075E54',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  avatarPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075E54',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  avatarPickerButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  selectedAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  saveUserButton: {
    backgroundColor: '#075E54',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  saveUserButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  imageOptionsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: width * 0.8,
    alignItems: 'center',
  },
  imageOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#075E54',
  },
  imageOptionButton: {
    backgroundColor: '#075E54',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  imageOptionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  labelInputContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: width * 0.8,
    alignItems: 'center',
  },
  labelInputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#075E54',
  },
});
