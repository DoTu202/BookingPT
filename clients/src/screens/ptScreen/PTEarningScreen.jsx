import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Users,
  BarChart3,
  Clock,
} from 'lucide-react-native';

import appColors from '../../constants/appColors';
import { fontFamilies } from '../../constants/fontFamilies';
import ptApi from '../../apis/ptApi';
import LoadingModal from '../../modals/LoadingModal';

const { width } = Dimensions.get('window');

const PTEarningScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState(null);

  // Load earnings data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEarningsData();
    }, [])
  );

  const loadEarningsData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await ptApi.getEarningsData('monthly');
      if (response.data?.success) {
        setEarningsData(response.data.data);
        console.log('Earnings data loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEarningsData(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatsCard = (icon, title, value, subtitle) => (
    <View style={styles.statsCard}>
      <View style={styles.statsIconContainer}>
        {icon}
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={styles.statsValue}>{value}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderChartData = () => {
    if (!earningsData?.chartData || earningsData.chartData.length === 0) return null;

    const maxValue = Math.max(...earningsData.chartData.map(item => item.value));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Last 7 Days</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          {earningsData.chartData.map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBarFill,
                    { height: maxValue > 0 ? (item.value / maxValue) * 100 : 4 }
                  ]}
                />
              </View>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <Text style={styles.chartValue}>
                {item.value > 0 ? `${Math.round(item.value / 1000)}k` : '0'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
            {item.clientName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.date)} • {item.startTime}-{item.endTime}
          </Text>
        </View>
      </View>
      <Text style={styles.transactionAmount}>
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingModal visible={loading} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={appColors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Main Stats */}
        {earningsData && earningsData.hasData ? (
          <>
            <View style={styles.mainStatsContainer}>
              <View style={styles.totalEarningsCard}>
                <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
                <Text style={styles.totalEarningsValue}>
                  {formatCurrency(earningsData.totalEarnings || 0)}
                </Text>
                <Text style={styles.totalEarningsSubtitle}>
                  From {earningsData.totalSessions} completed sessions
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {renderStatsCard(
                <Calendar size={20} color={appColors.primary} strokeWidth={2} />,
                'Sessions',
                earningsData.totalSessions || 0,
                'Completed'
              )}
              {renderStatsCard(
                <DollarSign size={20} color={appColors.success} strokeWidth={2} />,
                'Avg/Session',
                formatCurrency(earningsData.averagePerSession || 0),
                'Average'
              )}
              {renderStatsCard(
                <Users size={20} color={appColors.warning} strokeWidth={2} />,
                'Clients',
                earningsData.uniqueClients || 0,
                'Unique'
              )}
            </View>

            {/* Chart */}
            {renderChartData()}

            {/* Recent Transactions */}
            {earningsData.recentTransactions && earningsData.recentTransactions.length > 0 && (
              <View style={styles.transactionsContainer}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <FlatList
                  data={earningsData.recentTransactions}
                  renderItem={renderTransactionItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <BarChart3 size={64} color={appColors.gray} strokeWidth={1} />
            <Text style={styles.emptyStateTitle}>No Earnings Yet</Text>
            <Text style={styles.emptyStateMessage}>
              Complete some sessions to start earning money and see your earnings here
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
      <SafeAreaView edges={['bottom']} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.gray6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 12,
    backgroundColor: appColors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.semiBold,
    color: appColors.white,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  mainStatsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  totalEarningsCard: {
    backgroundColor: appColors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  totalEarningsLabel: {
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  totalEarningsValue: {
    fontSize: 28,
    fontFamily: fontFamilies.bold,
    color: appColors.white,
    marginBottom: 8,
  },
  totalEarningsSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${appColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: appColors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  statsSubtitle: {
    fontSize: 10,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: appColors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    marginBottom: 16,
  },
  chartScroll: {
    flexGrow: 0,
  },
  chartBar: {
    alignItems: 'center',
    marginRight: 20,
    width: 35,
  },
  chartBarContainer: {
    height: 100,
    width: 12,
    backgroundColor: appColors.gray5,
    borderRadius: 6,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    backgroundColor: appColors.primary,
    borderRadius: 6,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.medium,
    color: appColors.gray,
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 10,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
  },
  transactionsContainer: {
    backgroundColor: appColors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: appColors.gray5,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 16,
    fontFamily: fontFamilies.semiBold,
    color: appColors.white,
  },
  transactionInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
  },
  transactionAmount: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    color: appColors.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.semiBold,
    color: appColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: appColors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PTEarningScreen;