// import React from 'react';
// import { View, Text, Image, TouchableOpacity } from 'react-native';

// const MenuItemCard = ({ item, onAdd }) => {
//   return (
//     <View style={{
//       flexDirection: 'row',
//       backgroundColor: '#fff',
//       marginVertical: 6,
//       borderRadius: 10,
//       overflow: 'hidden',
//       elevation: 2,
//     }}>
//       <Image source={item.image} style={{ width: 80, height: 80 }} />
//       <View style={{ flex: 1, padding: 10 }}>
//         <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
//         <Text style={{ color: '#666' }}>₹ {item.price.toFixed(2)}</Text>
//         <TouchableOpacity
//           style={{
//             marginTop: 8,
//             backgroundColor: '#0a84ff',
//             paddingVertical: 6,
//             paddingHorizontal: 12,
//             borderRadius: 6,
//             alignSelf: 'flex-start',
//           }}
//           onPress={() => onAdd(item)}
//         >
//           <Text style={{ color: '#fff' }}>Add</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default MenuItemCard;

// components/MenuItemCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MenuItemCard = ({ item, onAdd }) => {
  return (
    <View style={styles.card}>
      <Image source={item.image} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => onAdd(item)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
  },
  details: {
    flex: 1,
    padding: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d4a574',
  },
  addButton: {
    backgroundColor: '#d4a574',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MenuItemCard;