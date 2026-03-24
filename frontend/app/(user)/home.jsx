import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { colors, space, typography } from '../../constants/theme';
import Button from '../../components/Button';
import DataRow from '../../components/DataRow';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const { user, signOut } = useAuth();
  const [inputVal, setInputVal] = useState('');
  const [dataList, setDataList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    const { data } = await supabase.from('user_data').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setDataList(data);
  };

  const handleSubmit = async () => {
    if (!inputVal.trim()) return;
    setSubmitting(true);
    try {
      // 1. Send to ML backend
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      const res = await fetch(`${backendUrl}/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputVal })
      });
      const mlResult = await res.json();

      // 2. Save in Supabase user_data table
      const { data, error } = await supabase.from('user_data').insert([
        { user_id: user.id, content: inputVal, ml_result: mlResult }
      ]).select().single();

      if (data) {
        setDataList(prev => [{...data, _isNew: true }, ...prev]);
        setInputVal('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Simple signout for test purpose */}
        <Text style={styles.greeting} onPress={signOut}>Hey, {user?.email?.split('@')[0]}</Text>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter text to analyze..."
          placeholderTextColor={colors.textMuted}
          multiline
          value={inputVal}
          onChangeText={setInputVal}
        />
        <Button 
          title="ANALYZE →" 
          onPress={handleSubmit} 
          variant="primary" 
          style={styles.actionBtn} 
        />
      </View>

      <FlatList
        data={dataList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DataRow
            title={item.content}
            type={item.ml_result?.label}
            subtitle={`Conf: ${item.ml_result?.confidence}`}
            timestamp={new Date(item.created_at).toLocaleTimeString()}
            isNew={item._isNew}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: space.xxl,
  },
  header: {
    paddingHorizontal: space.md,
    marginBottom: space.lg,
  },
  greeting: {
    fontFamily: typography.heading,
    fontSize: 28,
    color: colors.text,
  },
  inputSection: {
    paddingHorizontal: space.md,
    marginBottom: space.xl,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.text,
    fontFamily: typography.mono,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: space.md,
  },
  actionBtn: {
    width: '100%',
  },
});
