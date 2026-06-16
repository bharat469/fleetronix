import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { scale, moderateScale, SCREEN, verticalScale } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';

interface SpendChartProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  data?: any;
}

const chartWidth = SCREEN.WIDTH - scale(40);
const chartHeight = verticalScale(120);

const SpendChart: React.FC<SpendChartProps> = ({ activeFilter, setActiveFilter, data }) => {
  const dataPoints = data?.data_points || [];
  const amounts = dataPoints.map((dp: any) => dp.amount || 0);
  const maxAmount = Math.max(...amounts, 1);

  const getDynamicPath = () => {
    if (dataPoints.length === 0) return '';
    
    return dataPoints.reduce((path: string, dp: any, index: number) => {
      const x = dataPoints.length > 1 ? (index / (dataPoints.length - 1)) * chartWidth : 0;
      const y = chartHeight - ((dp.amount / maxAmount) * (chartHeight - verticalScale(20))) - verticalScale(10);
      
      if (index === 0) {
        return `M ${x} ${y}`;
      }
      return `${path} L ${x} ${y}`;
    }, '');
  };

  const d = getDynamicPath();
  const hasData = dataPoints.length > 0 && dataPoints.some((item: any) => item.amount > 0);

  return (
    <View style={styles.container}>
      {hasData ? (
        <View>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <SvgGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#CA2027" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#CA2027" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            
            <Path
              d={`${d} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
              fill="url(#gradient)"
            />
            
            <Path
              d={d}
              stroke="#CA2027"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.labelsContainer}>
            <Text style={styles.axisLabel}>{dataPoints[0]?.label}</Text>
            <Text style={styles.axisLabel}>{dataPoints[Math.floor(dataPoints.length / 2)]?.label}</Text>
            <Text style={styles.axisLabel}>{dataPoints[dataPoints.length - 1]?.label}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No spend data available for this period</Text>
        </View>
      )}
      
      <View style={styles.filterContainer}>
        {['Today', 'Week', 'Month', 'Year'].map((item) => (
          <TouchableOpacity 
            key={item} 
            onPress={() => setActiveFilter(item)}
            style={[styles.filterItem, activeFilter === item && styles.activeFilter]}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.activeFilterText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    marginVertical: scale(10),
    alignItems: 'center',
  },
  noDataContainer: {
    width: chartWidth,
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#9CA3AF',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: chartWidth,
    marginTop: scale(5),
    paddingHorizontal: scale(5),
  },
  axisLabel: {
    fontSize: moderateScale(10),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#9CA3AF',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: scale(15),
  },
  filterItem: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(16),
    borderRadius: scale(20),
  },
  activeFilter: {
    backgroundColor: '#FDF2F2',
  },
  filterText: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#9CA3AF',
  },
  activeFilterText: {
    color: '#CA2027',
  },
});

export default SpendChart;
