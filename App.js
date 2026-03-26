import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@dailyflow_tracker_v1';

const CATEGORIES = [
  { key: 'habit', label: 'Habit' },
  { key: 'task', label: 'To-Do' },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'habit', label: 'Habits' },
  { key: 'task', label: 'To-Dos' },
];

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatDate = (value) => {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const seedItems = [
  {
    id: uid(),
    title: 'Drink 8 glasses of water',
    category: 'habit',
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: 'Finish mobile app report',
    category: 'task',
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: 'Walk for 20 minutes',
    category: 'habit',
    completed: true,
    createdAt: Date.now(),
  },
];

export default function App() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [screen, setScreen] = useState('home');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('habit');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (!loading) saveItems(items);
  }, [items, loading]);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems(seedItems);
      }
    } catch (error) {
      setItems(seedItems);
    } finally {
      setLoading(false);
    }
  };

  const saveItems = async (nextItems) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch (error) {
      console.log('Save error:', error);
    }
  };

  const addItem = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Missing title', 'Please enter a habit or to-do title.');
      return;
    }

    const newItem = {
      id: uid(),
      title: trimmed,
      category,
      completed: false,
      createdAt: Date.now(),
    };

    setItems((prev) => [newItem, ...prev]);
    setTitle('');
    setCategory('habit');
    setModalVisible(false);
    setScreen('home');
  };

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteItem = (id) => {
    Alert.alert('Delete item', 'Remove this item from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setItems((prev) => prev.filter((item) => item.id !== id)),
      },
    ]);
  };

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => item.completed).length;
    const habits = items.filter((item) => item.category === 'habit').length;
    const tasks = items.filter((item) => item.category === 'task').length;
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, habits, tasks, completionRate };
  }, [items]);

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => toggleItem(item.id)}
      onLongPress={() => deleteItem(item.id)}
      style={({ pressed }) => [
        styles.card,
        item.completed && styles.cardDone,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.badge, item.category === 'habit' ? styles.habitBadge : styles.taskBadge]}>
          <Text style={styles.badgeText}>
            {item.category === 'habit' ? 'Habit' : 'To-Do'}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={[styles.cardTitle, item.completed && styles.cardTitleDone]}>
        {item.title}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.helperText}>
          {item.completed ? 'Completed' : 'Tap to mark complete'}
        </Text>
        <Pressable onPress={() => deleteItem(item.id)} hitSlop={10}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const ScreenHeader = () => (
    <View style={styles.header}>
      <Text style={styles.brand}>DailyFlow</Text>
      <Text style={styles.subheading}>Habit + to-do tracker for daily progress</Text>

      <View style={styles.tabRow}>
        {['home', 'stats'].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setScreen(tab)}
            style={[styles.tabButton, screen === tab && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, screen === tab && styles.tabButtonTextActive]}>
              {tab === 'home' ? 'Tracker' : 'Stats'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader />

        {screen === 'home' ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{stats.total}</Text>
                <Text style={styles.summaryLabel}>Items</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{stats.done}</Text>
                <Text style={styles.summaryLabel}>Done</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{stats.completionRate}%</Text>
                <Text style={styles.summaryLabel}>Progress</Text>
              </View>
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.addButtonText}>+ Add Habit / To-Do</Text>
            </Pressable>

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No items yet</Text>
                  <Text style={styles.emptyText}>
                    Create your first habit or to-do to start tracking progress.
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <View style={styles.statsScreen}>
            <View style={styles.statsGrid}>
              <View style={styles.statsBox}>
                <Text style={styles.statsValue}>{stats.habits}</Text>
                <Text style={styles.statsLabel}>Habits</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsValue}>{stats.tasks}</Text>
                <Text style={styles.statsLabel}>To-Dos</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsValue}>{stats.done}</Text>
                <Text style={styles.statsLabel}>Completed</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsValue}>{stats.completionRate}%</Text>
                <Text style={styles.statsLabel}>Rate</Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>How the app works</Text>
              <Text style={styles.insightText}>
                Tap an item to mark it complete, long-press it to delete it, and use the filter
                buttons to switch between all items, habits, and to-dos.
              </Text>
            </View>
          </View>
        )}

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add new item</Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter habit or to-do"
                placeholderTextColor="#9aa0a6"
                style={styles.input}
              />

              <View style={styles.segmentRow}>
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c.key}
                    onPress={() => setCategory(c.key)}
                    style={[styles.segmentButton, category === c.key && styles.segmentButtonActive]}
                  >
                    <Text
                      style={[styles.segmentButtonText, category === c.key && styles.segmentButtonTextActive]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={addItem}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: '#f4f7fb',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 14,
  },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  subheading: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#111827',
  },
  tabButtonText: {
    fontWeight: '700',
    color: '#374151',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  summaryLabel: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    color: '#374151',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardDone: {
    opacity: 0.9,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  habitBadge: {
    backgroundColor: '#dbeafe',
  },
  taskBadge: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  dateText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  cardTitleDone: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 12,
  },
  deleteText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6b7280',
    maxWidth: 280,
    lineHeight: 20,
  },
  statsScreen: {
    flex: 1,
    paddingTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsBox: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  statsLabel: {
    marginTop: 5,
    color: '#6b7280',
    fontWeight: '600',
  },
  insightCard: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  insightText: {
    color: '#4b5563',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.45)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#111827',
  },
  segmentButtonText: {
    fontWeight: '700',
    color: '#374151',
  },
  segmentButtonTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontWeight: '700',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontWeight: '800',
    color: '#ffffff',
  },
});
