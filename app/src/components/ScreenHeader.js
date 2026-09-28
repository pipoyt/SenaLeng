import { StyleSheet, Text, View } from 'react-native';
import { font } from '../theme';

export default function ScreenHeader({ overline = 'SeñaLeng', title, right }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {overline ? <Text style={font.overline}>{overline}</Text> : null}
        <Text style={[font.h1, { marginTop: 2 }]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
});
