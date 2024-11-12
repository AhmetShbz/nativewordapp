import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated as RNAnimated,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.75; // Ekran yüksekliğinin %75'i

const WordCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);

  const flipAnimation = useRef(new RNAnimated.Value(0)).current;

  const flipCard = useCallback(() => {
    const toValue = isFlipped ? 0 : 180;

    RNAnimated.spring(flipAnimation, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
    });
  }, [isFlipped, flipAnimation]);

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

  const handleEditNote = useCallback((noteToEdit) => {
    setNote(noteToEdit.text);
    setEditingNoteId(noteToEdit.id);
    setShowNoteInput(true);
  }, []);
  const handleDeleteNote = useCallback((noteId) => {
    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
  }, []);

  const renderNoteItem = useCallback((noteItem) => (
    <View
      key={noteItem.id}
      style={styles.noteItem}
    >
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
  ), [handleEditNote, handleDeleteNote]);

  // Sort notes by timestamp in reverse order
  const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <View style={styles.container}>
      {/* Ana içerik - Tek ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <RNAnimated.View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: progress < 33 ? '#FF6B6B' : progress < 66 ? '#FFD93D' : '#6BCB77'
              }
            ]}
          />
        </View>

        {/* Card Container */}
        <View style={styles.cardContainer}>
          {/* Front of Card */}
          <RNAnimated.View
            style={[styles.card, frontAnimatedStyle, isFlipped && styles.cardHidden]}
            pointerEvents={isFlipped ? 'none' : 'auto'}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>A1</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsFavorite(!isFavorite)}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={24}
                    color={isFavorite ? "#FF6B6B" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.soundButton}>
                <Ionicons name="volume-high" size={24} color="#4CACBC" />
              </TouchableOpacity>
            </View>

            {/* Word Section */}
            <View style={styles.wordSection}>
              <Text style={styles.wordText}>homework</Text>
              <Text style={styles.partOfSpeech}>(noun)</Text>
            </View>

            {/* Definition Section */}
            <View style={styles.definitionSection}>
              <Text style={styles.definitionText}>
                school work that a pupil is required to do at home
              </Text>
              <Text style={styles.translationText}>ev ödevi, ödev</Text>
            </View>

            {/* Example Section */}
            <View style={styles.exampleSection}>
              <Text style={styles.exampleText}>
                I have a lot of homework to do.
              </Text>
              <Text style={styles.exampleTranslation}>
                Yapacak bir sürü ödevim var.
              </Text>
            </View>

            {/* Notes Section */}
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
                  {sortedNotes.map(renderNoteItem)}
                </ScrollView>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => setProgress(Math.max(0, progress - 10))}
              >
                <Ionicons name="refresh" size={24} color="#6B7280" />
                <Text style={styles.footerButtonText}>Atla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => setProgress(Math.min(100, progress + 10))}
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
          </RNAnimated.View>

          {/* Back of Card */}
          <RNAnimated.View
            style={[styles.card, styles.cardBack, backAnimatedStyle, !isFlipped && styles.cardHidden]}
            pointerEvents={isFlipped ? 'auto' : 'none'}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.detailsTitle}>Detaylar</Text>

              <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Eş Anlamlılar</Text>
                  <Text style={styles.detailText}>assignment, schoolwork, study</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Kullanım Notları</Text>
                  <Text style={styles.detailText}>
                    "Homework" sayılamaz bir isimdir. "a piece of homework" veya "some homework" şeklinde kullanılır.
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ek Örnekler</Text>
                  <View style={styles.detailExamples}>
                    <View style={styles.detailExample}>
                      <Text style={styles.detailExampleText}>
                        Have you finished your homework?
                      </Text>
                      <Text style={styles.detailExampleTranslation}>
                        Ödevini bitirdin mi?
                      </Text>
                    </View>
                    <View style={styles.detailExample}>
                      <Text style={styles.detailExampleText}>
                        She always does her homework on time.
                      </Text>
                      <Text style={styles.detailExampleTranslation}>
                        O her zaman ödevini zamanında yapar.
                      </Text>
                    </View>
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
          </RNAnimated.View>
        </View>
      </ScrollView>

      {/* Not ekleme modal */}
      {showNoteInput && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.noteModalOverlay}
        >
          <View style={styles.noteModalContent}>
            <View style={styles.noteModalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setNote('');
                  setShowNoteInput(false);
                  setEditingNoteId(null);
                }}
                style={styles.modalHeaderButton}
              >
                <Ionicons name="close-circle" size={28} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddNote}
                disabled={!note.trim()}
                style={[styles.modalHeaderButton, !note.trim() && styles.modalHeaderButtonDisabled]}
              >
                <Ionicons name="checkmark-circle" size={28} color={note.trim() ? "#6BCB77" : "#2A3C50"} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
              placeholder="Notunuzu yazın..."
              placeholderTextColor="#6B7280"
              multiline
              maxLength={200}
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1, // Bu eklendi
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
    marginBottom: 32, // Bu eklendi
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
    maxHeight: CARD_HEIGHT * 0.3, // Kartın %30'u kadar
  },
  notesListContainer: {
    width: '100%',
  },
  notesScrollView: {
    flex: 1,
  },
  notesSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  moreNotesButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2A3C50',
    borderRadius: 12,
    marginTop: 8,
  },
  moreNotesText: {
    color: '#4CACBC',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  noteInputSection: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#2A3C50',
  },
  noteInputContainer: {
    backgroundColor: '#1A2634',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3C50',
    margin: 16,
  },
  noteInput: {
    fontSize: 15,
    color: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: 22,
  },
  noteInputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CACBC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#2A3C50',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
});

export default WordCard;