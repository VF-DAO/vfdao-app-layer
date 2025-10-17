import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/colors';
import { useWallet } from '@/contexts/wallet-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { accountId, isConnected, isConnecting, balance, connect, disconnect, getBalance, error } = useWallet();
  
  const colors = Colors[colorScheme];

  const handleConnect = async () => {
    try {
      console.log('[Dashboard] Connect button pressed');
      await connect();
    } catch (err) {
      console.error('[Dashboard] Connect failed:', err);
      Alert.alert('Connection Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>VF Eco App</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Product Verification & Rewards
        </Text>
      </View>

      {/* Wallet Status Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Wallet Status</Text>
        </View>
        
        {error && (
          <View style={[styles.errorBox, { backgroundColor: '#ffebee' }]}>
            <Text style={[styles.errorText, { color: '#c62828' }]}>⚠️ {error}</Text>
          </View>
        )}
        
        {!isConnected && (
          <View style={[styles.infoBox, { backgroundColor: '#e3f2fd', borderLeftColor: '#1976d2' }]}>
            <Text style={[styles.infoText, { color: '#1565c0' }]}>
              ℹ️ On web: Opens HERE Wallet popup{'\n'}
              On mobile: Uses HERE Wallet app
            </Text>
          </View>
        )}
        
        {isConnected ? (
          <>
            <Text style={[styles.accountId, { color: colors.tint }]}>
              {accountId}
            </Text>
            {balance && (
              <View style={styles.balanceContainer}>
                <Text style={[styles.balanceLabel, { color: colors.tabIconDefault }]}>Balance:</Text>
                <Text style={[styles.balanceValue, { color: Colors.light.tint }]}>
                  {balance} Ⓝ
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.border }]}
              onPress={disconnect}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.disconnected, { color: colors.tabIconDefault }]}>
              Not connected
            </Text>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: Colors.light.tint }]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: Colors.light.tint }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Verified</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: Colors.light.accent }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Badges</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.actionText, { color: colors.tint }]}>📱 Scan QR Code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.actionText, { color: colors.tint }]}>🏆 View Rewards</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.actionText, { color: colors.tint }]}>📊 Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountId: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  disconnected: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
