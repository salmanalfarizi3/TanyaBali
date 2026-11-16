const chatbot = require('../services/chatbotService');

exports.page = (req, res) => res.render('chatbot', { title: 'Tanya AI — TanyaBali' });

exports.ask = async (req, res) => {
  const question = String(req.body.message || '').trim();

  if (!question || question.length > 1000) {
    return res.status(400).json({
      status: 'error',
      message: 'Pertanyaan wajib diisi dan maksimal 1.000 karakter.'
    });
  }

  try {
    // History dari browser tidak dijadikan instruksi atau sumber fakta.
    const result = await chatbot.reply(question);
    return res.json({ status: 'success', ...result });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Chatbot sedang mengalami kendala. Silakan coba kembali.'
    });
  }
};
