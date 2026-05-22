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

const SpendChart: React.FC<SpendChartProps> = ({ activeFilter, setActiveFilter, data }) => {
  const chartWidth = SCREEN.WIDTH - scale(40);
  const chartHeight = verticalScale(120);

  // Different paths for different filters to show "fluctuation"
  const getPath = () => {
    switch (activeFilter) {
      case 'Week':
        return `M 0 ${chartHeight * 0.4} 
                C ${chartWidth * 0.2} ${chartHeight * 0.8}, ${chartWidth * 0.4} ${chartHeight * 0.2}, ${chartWidth * 0.6} ${chartHeight * 0.6} 
                S ${chartWidth * 0.8} ${chartHeight * 0.1}, ${chartWidth} ${chartHeight * 0.4}`;
      case 'Month':
        return `M 0 ${chartHeight * 0.8} 
                C ${chartWidth * 0.1} ${chartHeight * 0.9}, ${chartWidth * 0.3} ${chartHeight * 0.5}, ${chartWidth * 0.5} ${chartHeight * 0.7} 
                S ${chartWidth * 0.8} ${chartHeight * 0.2}, ${chartWidth} ${chartHeight * 0.6}`;
      case 'Year':
        return `M 0 ${chartHeight * 0.5} 
                C ${chartWidth * 0.2} ${chartHeight * 0.2}, ${chartWidth * 0.4} ${chartHeight * 0.8}, ${chartWidth * 0.6} ${chartHeight * 0.3} 
                S ${chartWidth * 0.8} ${chartHeight * 0.9}, ${chartWidth} ${chartHeight * 0.4}`;
      default: // Today
        return `M 0 ${chartHeight * 0.7} 
                C ${chartWidth * 0.1} ${chartHeight * 0.6}, ${chartWidth * 0.15} ${chartHeight * 0.9}, ${chartWidth * 0.25} ${chartHeight * 0.8} 
                S ${chartWidth * 0.35} ${chartHeight * 0.4}, ${chartWidth * 0.45} ${chartHeight * 0.7}
                S ${chartWidth * 0.6} ${chartHeight * 0.9}, ${chartWidth * 0.75} ${chartHeight * 0.3}
                S ${chartWidth * 0.9} ${chartHeight * 0.6}, ${chartWidth} ${chartHeight * 0.5}`;
    }
  };

  const d = getPath();

  return (
    <View style={styles.container}>
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
