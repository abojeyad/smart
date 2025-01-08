const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// تعريف المجلد الذي يحتوي على ملفاتك (مثل HTML, CSS, JS)
app.use(express.static(path.join(__dirname, ''))); // نستخدم المجلد الحالي

// تمكين استقبال بيانات JSON في الطلبات
app.use(express.json());

// واجهة تحميل ملف JSON الحالي (للمنتجات)
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'products.json'));
});

// واجهة لإضافة منتج جديد
app.post('/add-product', (req, res) => {
    const newProduct = req.body;

    // قراءة ملف JSON الموجود
    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
        }

        // إضافة المنتج الجديد إلى القائمة
        const products = JSON.parse(data);
        products.push(newProduct);

        // كتابة البيانات الجديدة إلى ملف JSON
        fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).send('Error writing file');
            }

            res.status(200).send('Product added successfully');
        });
    });
});

// تشغيل السيرفر
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
