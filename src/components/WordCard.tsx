//çalışıyor..
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { words } from '../data/words'; // Doğru yolu belirleyin

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.75;

interface Note {
  id: number;
  text: string;
  timestamp: number;
}

type NoteModalProps = {
  note: string;
  onChangeNote: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
};

// Custom Hooks
const useFlipAnimation = (initialValue = 0) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(initialValue)).current;

  useEffect(() => {
    return () => {
      flipAnimation.removeAllListeners();
    };
  }, []);

  const flipCard = useCallback(() => {
    const toValue = isFlipped ? 0 : 180;

    Animated.spring(flipAnimation, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    // State'i hemen güncelle, animasyonun bitmesini bekleme
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  return {
    isFlipped,
    flipCard,
    frontAnimatedStyle,
    backAnimatedStyle,
  };
};

// useNotes içinde fonksiyon parametrelerine tipler eklendi
const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const handleAddNote = useCallback(() => {
    if (note.trim()) {
      if (editingNoteId) {
        setNotes(prevNotes =>
          prevNotes.map(n => (n.id === editingNoteId ? { ...n, text: note, timestamp: Date.now() } : n))
        );
        setEditingNoteId(null);
      } else {
        setNotes(prevNotes => [
          ...prevNotes,
          {
            id: Date.now(),
            text: note,
            timestamp: Date.now()
          }
        ]);
      }
      setNote('');
      setShowNoteInput(false);
    }
  }, [note, editingNoteId]);

  const handleEditNote = useCallback((noteToEdit: Note) => {
    setNote(noteToEdit.text);
    setEditingNoteId(noteToEdit.id);
    setShowNoteInput(true);
  }, []);

  const handleDeleteNote = useCallback((noteId: number) => {
    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
  }, []);

  return {
    notes: [...notes].sort((a, b) => b.timestamp - a.timestamp),  // Array'i kopyalayarak mutasyonu önledik
    note,
    showNoteInput,
    editingNoteId,
    setNote,
    setShowNoteInput,
    handleAddNote,
    handleEditNote,
    handleDeleteNote,
  };
};

const useProgress = () => {
  const [progress, setProgress] = useState(0);

  const increaseProgress = useCallback(() => {
    setProgress(prev => Math.min(100, prev + 10));
  }, []);

  const decreaseProgress = useCallback(() => {
    setProgress(prev => Math.max(0, prev - 10));
  }, []);

  return {
    progress,
    increaseProgress,
    decreaseProgress,
  };
};

// Level için özel bir tip tanımı
type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// CardHeaderProps güncellendi
type CardHeaderProps = {
  level?: Level | string;  // level opsiyonel yapıldı
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPlaySound: () => void;
};

// WordCardProps güncellendi
type WordCardProps = {
  wordData: {
    level?: Level | string;  // level opsiyonel yapıldı
    word: string;
    partOfSpeech: string;
    definition: string;
    translation: string;
    example: {
      text: string;
      translation: string;
    };
    details: {
      synonyms: string[];
      usageNotes: string;
      additionalExamples: Array<{
        text: string;
        translation: string;
      }>;
    };
  };
};

// CardHeader bileşeni güncellendi
const CardHeader: React.FC<CardHeaderProps> = ({ level = 'A1', isFavorite, onToggleFavorite, onPlaySound }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>{level}</Text>
      </View>
      <TouchableOpacity onPress={onToggleFavorite} style={styles.iconButton}>
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={24}
          color={isFavorite ? "#FF6B6B" : "#9CA3AF"}
        />
      </TouchableOpacity>
    </View>
    <TouchableOpacity onPress={onPlaySound} style={styles.soundButton}>
      <Ionicons name="volume-high" size={24} color="#4CACBC" />
    </TouchableOpacity>
  </View>
);

// 1. WordSectionProps tipinin doğru tanımlandığından emin ol
type WordSectionProps = {
  word: string;
  partOfSpeech: string;
};

// 2. WordSection bileşeninin doğru şekilde tanımlandığını ve kullanılabilir olduğunu doğrula
const WordSection: React.FC<WordSectionProps> = ({ word, partOfSpeech }) => (
  <View style={styles.wordSection}>
    <Text style={styles.wordText}>{word}</Text>
    <Text style={styles.partOfSpeech}>({partOfSpeech})</Text>
  </View>
);

const NoteModal: React.FC<NoteModalProps> = ({ note, onChangeNote, onSave, onClose }) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={styles.noteModalOverlay}
  >
    <View style={styles.noteModalContent}>
      <View style={styles.noteModalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.modalHeaderButton}>
          <Ionicons name="close-circle" size={28} color="#FF6B6B" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          disabled={!note.trim()}
          style={[styles.modalHeaderButton, !note.trim() && styles.modalHeaderButtonDisabled]}
        >
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={note.trim() ? "#6BCB77" : "#2A3C50"}
          />
        </TouchableOpacity>
      </View>
      <TextInput
        value={note}
        onChangeText={onChangeNote}
        style={styles.noteInput}
        placeholder="Notunuzu yazın..."
        placeholderTextColor="#6B7280"
        multiline
        maxLength={200}
        autoFocus
      />
    </View>
  </KeyboardAvoidingView>
);

// Main Component
const WordCard: React.FC = () => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const wordData = words[currentWordIndex];

  const { isFlipped, flipCard, frontAnimatedStyle, backAnimatedStyle } = useFlipAnimation();
  const {
    notes,
    note,
    showNoteInput,
    setNote,
    setShowNoteInput,
    handleAddNote,
    handleEditNote,
    handleDeleteNote,
  } = useNotes();
  const { progress, increaseProgress, decreaseProgress } = useProgress();

  const handlePlaySound = () => {
    // Implement sound playing logic
    console.log('Playing sound...');
  };

  // Platform-specific shadow stilleri
  const cardShadow = useMemo(() => Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
  }), []);

  // Memory leak'i önlemek için cleanup
  useEffect(() => {
    return () => {
      // Diğer cleanup işlemleri
    };
  }, []);

  // wordData'nın tanımlı olduğunu kontrol et
  if (!wordData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Kelime verisi yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: progress < 33 ? '#FF6B6B' : progress < 66 ? '#FFD93D' : '#6BCB77'
              }
            ]}
          />
        </View>

        <View style={styles.cardContainer}>
          <Animated.View
            style={[styles.card, frontAnimatedStyle, isFlipped && styles.cardHidden]}
            pointerEvents={isFlipped ? 'none' : 'auto'}
          >
            <CardHeader
              level={wordData.level}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite(!isFavorite)}
              onPlaySound={handlePlaySound}
            />

            <WordSection word={wordData.word} partOfSpeech={wordData.partOfSpeech} />

            <View style={styles.definitionSection}>
              <Text style={styles.definitionText}>{wordData.definition}</Text>
              <Text style={styles.translationText}>{wordData.translation}</Text>
            </View>

            <View style={styles.exampleSection}>
              <Text style={styles.exampleText}>{wordData.example.text}</Text>
              <Text style={styles.exampleTranslation}>{wordData.example.translation}</Text>
            </View>

            {notes.length > 0 && (
              <View style={styles.allNotesSection}>
                <Text style={styles.notesSectionTitle}>
                  Notlarım {notes.length > 0 && `(${notes.length})`}
                </Text>
                <ScrollView
                  style={styles.notesScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {notes.map((noteItem) => (
                    <View key={noteItem.id} style={styles.noteItem}>
                      <View style={styles.noteContent}>
                        <Text style={styles.noteText}>{noteItem.text}</Text>
                        <Text style={styles.noteTimestamp}>
                          {new Date(noteItem.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.noteActions}>
                        <TouchableOpacity
                          onPress={() => handleEditNote(noteItem)}
                          style={[styles.noteActionButton, styles.editButton]}
                        >
                          <Ionicons name="pencil" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteNote(noteItem.id)}
                          style={[styles.noteActionButton, styles.deleteButton]}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={decreaseProgress}
              >
                <Ionicons name="refresh" size={24} color="#6B7280" />
                <Text style={styles.footerButtonText}>Atla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={increaseProgress}
              >
                <Ionicons name="thumbs-up" size={24} color="#6B7280" />
                <Text style={styles.footerButtonText}>Biliyorum</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => setShowNoteInput(true)}
              >
                <Ionicons name="create-outline" size={24} color="#6B7280" />
                <Text style={styles.footerButtonText}>Not Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={flipCard}
              >
                <Ionicons name="book" size={24} color="#6B7280" />
                <Text style={styles.footerButtonText}>Detaylar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={[styles.card, styles.cardBack, backAnimatedStyle, !isFlipped && styles.cardHidden]}
            pointerEvents={isFlipped ? 'auto' : 'none'}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.detailsTitle}>Detaylar</Text>

              <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Eş Anlamlılar</Text>
                  <Text style={styles.detailText}>{wordData.details.synonyms.join(', ')}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Kullanım Notları</Text>
                  <Text style={styles.detailText}>{wordData.details.usageNotes}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ek Örnekler</Text>
                  <View style={styles.detailExamples}>
                    {wordData.details.additionalExamples.map((example, index) => (
                      <View key={index} style={styles.detailExample}>
                        <Text style={styles.detailExampleText}>{example.text}</Text>
                        <Text style={styles.detailExampleTranslation}>{example.translation}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.flipBackButton}
              onPress={flipCard}
            >
              <Text style={styles.flipBackButtonText}>Kartı Çevir</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      {showNoteInput && (
        <NoteModal
          note={note}
          onChangeNote={setNote}
          onSave={handleAddNote}
          onClose={() => {
            setNote('');
            setShowNoteInput(false);
          }}
        />
      )}
    </View>
  );
};

// Styles dışarı alındı
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardContainer: {
    height: CARD_HEIGHT,
    position: 'relative',
    width: width - 32,
    marginBottom: 32,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#171717',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardBack: {
    backgroundColor: '#171717',
  },
  cardHidden: {
    backfaceVisibility: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: '#1A2634',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4CACBC',
  },
  levelText: {
    color: '#4CACBC',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  soundButton: {
    padding: 8,
    backgroundColor: '#1A2634',
    borderRadius: 12,
  },
  wordSection: {
    marginBottom: 20,
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  partOfSpeech: {
    fontSize: 16,
    color: '#A0A0A0',
    fontStyle: 'italic',
  },
  definitionSection: {
    backgroundColor: '#1A2634',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A3C50',
  },
  definitionText: {
    fontSize: 17,
    color: '#E0E0E0',
    marginBottom: 12,
    lineHeight: 26,
  },
  translationText: {
    fontSize: 17,
    color: '#4CACBC',
    fontWeight: '600',
  },
  exampleSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  exampleText: {
    fontSize: 16,
    color: '#6BCB77',
    marginBottom: 6,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  exampleTranslation: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 24,
  },
  allNotesSection: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: '#1A2634',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3C50',
    maxHeight: CARD_HEIGHT * 0.3,
  },
  notesSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  notesScrollView: {
    flex: 1,
  },
  noteItem: {
    backgroundColor: '#2A3C50',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteContent: {
    flex: 1,
    marginRight: 12,
  },
  noteText: {
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 22,
    marginBottom: 4,
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  noteActions: {
    flexDirection: 'row',
  },
  noteActionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#4CACBC',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A3C50',
    marginTop: 'auto',
  },
  footerButton: {
    alignItems: 'center',
    padding: 8,
  },
  footerButtonText: {
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 6,
  },
  detailsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  detailsSection: {
    flex: 1,
  },
  detailItem: {
    backgroundColor: '#1A2634',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3C50',
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4CACBC',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
  },
  detailExamples: {
    marginTop: 12,
  },
  detailExample: {
    marginBottom: 16,
  },
  detailExampleText: {
    fontSize: 16,
    color: '#6BCB77',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  detailExampleTranslation: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 24,
  },
  flipBackButton: {
    backgroundColor: '#4CACBC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  flipBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noteModalOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  noteModalContent: {
    backgroundColor: '#1A2634',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3C50',
    borderBottomWidth: 0,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderButton: {
    padding: 4,
  },
  modalHeaderButtonDisabled: {
    opacity: 0.5,
  },
  noteInput: {
    fontSize: 15,
    color: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: 22,
  },
  // 4. Hata mesajları için gerekli stilleri ekle
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export type { WordCardProps, Note, Level };  // Level tipini de export ediyoruz
export default React.memo(WordCard);