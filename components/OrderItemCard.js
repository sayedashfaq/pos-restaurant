import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const OrderItemCard = ({ item, onRemove }) => {
  return (
    <View style={{
      backgroundColor: '#fff',
      padding: 12,
      marginVertical: 6,
      borderRadius: 10,
      elevation: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <View>
        <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
        <Text>₹ {item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(item)}
        style={{
          backgroundColor: '#ff3b30',
          paddingVertical: 4,
          paddingHorizontal: 12,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: '#fff' }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrderItemCard;
