import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const ReportAssessmentModal = ({ 
  visible, 
  onClose, 
  onDownload, 
  assessmentData 
}) => {
  if (!assessmentData) return null;

  const {
    coordinationLevel,
    brainActivityLevel,
    focusLevel,
    perceptionLevel,
    coordinationAssessment,
    brainActivityAssessment,
    focusAssessment,
    perceptionAssessment
  } = assessmentData;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.modalTitle}>腦電波評測報告</Text>
            
            <View style={styles.assessmentSection}>
              <Text style={styles.sectionTitle}>★ 協調力：<Text style={styles.levelText}>{coordinationLevel}級 - {coordinationAssessment.title}</Text></Text>
              <Text style={styles.descriptionText}>{coordinationAssessment.description}</Text>
            </View>
            
            <View style={styles.assessmentSection}>
              <Text style={styles.sectionTitle}>★ 腦活力：<Text style={styles.levelText}>{brainActivityLevel}級 - {brainActivityAssessment.title}</Text></Text>
              <Text style={styles.descriptionText}>{brainActivityAssessment.description}</Text>
            </View>
            
            <View style={styles.assessmentSection}>
              <Text style={styles.sectionTitle}>★ 專注力：<Text style={styles.levelText}>{focusLevel}級 - {focusAssessment.title}</Text></Text>
              <Text style={styles.descriptionText}>{focusAssessment.description}</Text>
            </View>
            
            <View style={styles.assessmentSection}>
              <Text style={styles.sectionTitle}>★ 感知力：<Text style={styles.levelText}>{perceptionLevel}級 - {perceptionAssessment.title}</Text></Text>
              <Text style={styles.descriptionText}>{perceptionAssessment.description}</Text>
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.downloadButton]} 
              onPress={onDownload}
            >
              <Text style={styles.buttonText}>下載報告</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    textAlign: 'center',
    marginBottom: 20,
  },
  assessmentSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  levelText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#333',
  },
});

export default ReportAssessmentModal;
